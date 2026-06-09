-- ============================================================
-- 0020_tarefas_acompanhadas.sql
-- TAREFA ACOMPANHADA (painel COMPARTILHADO) + NOTIFICAÇÕES IN-APP.
--
-- Uma mensagem direta (tarefas_diretas, agrupada por grupo_id) pode ser
-- "promovida" a uma tarefa acompanhada: um item ÚNICO e compartilhado que
-- todos os envolvidos (remetente + todos os destinatários) veem e podem
-- comentar / concluir / reabrir. Cada alteração gera NOTIFICAÇÃO IN-APP
-- (caixa + badge) para os demais envolvidos.
--
-- Escopo (Fase 1 — modo seguro):
--   • painel compartilhado + histórico de eventos
--   • notificações IN-APP (tabela handover_notificacoes) + contador (badge)
--   • NÃO inclui push, VAPID, segredos nem Edge Function (Fase 2).
--
-- Separação in-app x push:
--   • handover_notificacoes = canal IN-APP (lista + badge). Usado aqui.
--   • handover_notificacoes.push_enviado = "costura" da Fase 2: o worker de
--     push (Edge Function, fora daqui) lerá push_enviado=false, enviará o
--     web-push e marcará true. Nada nesta migration escreve/lê essa coluna.
--
-- Nomes: a tabela de notificações é prefixada (handover_notificacoes) para
-- evitar colisão com uma eventual tabela genérica "notificacoes". As demais
-- (tarefas_acompanhadas*) seguem a família "tarefas_*" do módulo (0017).
--
-- PRÉ-REQUISITO: rodar o preflight (migracao/preflight_0020...sql) antes —
-- ele aborta se qualquer uma destas tabelas já existir.
--
-- Segurança: padrão do projeto — RLS habilitado SEM policy; acesso só via
-- RPCs SECURITY DEFINER que validam a sessão (handover_check_session).
-- Idempotente: create ... if not exists / create or replace.
-- ============================================================

-- ------------------------------------------------------------
-- TABELAS
-- ------------------------------------------------------------

-- Item compartilhado. grupo_id é UNIQUE → 1 tarefa por mensagem (idempotência).
create table if not exists public.tarefas_acompanhadas (
  id              uuid primary key default gen_random_uuid(),
  grupo_id        uuid not null unique,            -- liga a tarefas_diretas.grupo_id (1:1)
  titulo          text not null,                   -- texto da mensagem (ou título informado)
  status          text not null default 'Pendente'
                    constraint chk_tacomp_status check (status in ('Pendente','Concluído')),
  criado_por      text not null,                   -- quem promoveu
  criado_nome     text,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now(), -- toca a cada alteração (ordenação/tracking)
  concluido_por   text,
  concluido_nome  text,
  concluido_em    timestamptz
);
alter table public.tarefas_acompanhadas enable row level security;
create index if not exists idx_tacomp_status on public.tarefas_acompanhadas(status, atualizado_em desc);

-- Participantes (envolvidos). PK composta = dedup garantido por (tarefa, usuario).
create table if not exists public.tarefas_acompanhadas_participantes (
  tarefa_id     uuid not null references public.tarefas_acompanhadas(id) on delete cascade,
  usuario       text not null,
  usuario_nome  text,
  papel         text constraint chk_tacomp_part_papel
                  check (papel in ('remetente','destinatario','promotor')),
  criado_em     timestamptz not null default now(),
  primary key (tarefa_id, usuario)                 -- <- impede usuário repetido na mesma tarefa
);
alter table public.tarefas_acompanhadas_participantes enable row level security;
create index if not exists idx_tacomp_part_usuario on public.tarefas_acompanhadas_participantes(usuario);

-- Histórico de eventos (criação, comentário, conclusão, reabertura).
create table if not exists public.tarefas_acompanhadas_eventos (
  id          uuid primary key default gen_random_uuid(),
  tarefa_id   uuid not null references public.tarefas_acompanhadas(id) on delete cascade,
  autor       text not null,
  autor_nome  text,
  tipo        text not null constraint chk_tacomp_evt_tipo
                check (tipo in ('criacao','comentario','conclusao','reabertura')),
  texto       text,                                -- comentário (null em eventos de status)
  criado_em   timestamptz not null default now()
);
alter table public.tarefas_acompanhadas_eventos enable row level security;
create index if not exists idx_tacomp_evt on public.tarefas_acompanhadas_eventos(tarefa_id, criado_em);

-- Caixa de notificações IN-APP (badge + lista). Prefixada p/ evitar colisão.
-- Escopo fechado nesta fase: tipo/ref_tipo só 'tarefa_acompanhada' (ou null).
-- Migrations futuras podem ampliar o domínio desses CHECKs conforme novos tipos.
create table if not exists public.handover_notificacoes (
  id            uuid primary key default gen_random_uuid(),
  usuario       text not null,                     -- destinatário da notificação
  titulo        text not null,
  corpo         text,
  tipo          text constraint chk_hnotif_tipo
                  check (tipo is null or tipo in ('tarefa_acompanhada')),
  ref_tipo      text constraint chk_hnotif_ref_tipo
                  check (ref_tipo is null or ref_tipo in ('tarefa_acompanhada')),
  ref_id        uuid,                              -- id do item referenciado (deep-link)
  lida          boolean not null default false,
  push_enviado  boolean not null default false,    -- COSTURA Fase 2 (push). Não usado aqui.
  criado_em     timestamptz not null default now()
);
alter table public.handover_notificacoes enable row level security;
create index if not exists idx_hnotif_usuario on public.handover_notificacoes(usuario, lida, criado_em desc);
create index if not exists idx_hnotif_push_pendente on public.handover_notificacoes(criado_em) where push_enviado = false;

-- ------------------------------------------------------------
-- HELPERS INTERNOS (sem grant a anon)
-- ------------------------------------------------------------

-- Serializa uma tarefa acompanhada (PascalCase, padrão do contrato do front).
create or replace function public._tacomp_to_json(r public.tarefas_acompanhadas)
returns jsonb language sql stable set search_path = public as $$
  select jsonb_build_object(
    'ID', r.id, 'Grupo_ID', r.grupo_id, 'Titulo', r.titulo, 'Status', r.status,
    'Criado_Por', r.criado_por, 'Criado_Nome', r.criado_nome,
    'Criado_Em',     to_char(r.criado_em     at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI:SS'),
    'Atualizado_Em', to_char(r.atualizado_em at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI:SS'),
    'Concluido_Por', r.concluido_nome,
    'Concluido_Em',  case when r.concluido_em is null then null
                          else to_char(r.concluido_em at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI:SS') end,
    'Participantes', coalesce((
      select jsonb_agg(jsonb_build_object('Usuario', p.usuario, 'Nome', p.usuario_nome, 'Papel', p.papel)
               order by p.papel, p.usuario)
      from public.tarefas_acompanhadas_participantes p where p.tarefa_id = r.id), '[]'::jsonb),
    'Eventos', coalesce((
      select jsonb_agg(jsonb_build_object(
               'Tipo', e.tipo, 'Autor', e.autor, 'Autor_Nome', e.autor_nome, 'Texto', e.texto,
               'Criado_Em', to_char(e.criado_em at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI:SS'))
               order by e.criado_em asc)
      from public.tarefas_acompanhadas_eventos e where e.tarefa_id = r.id), '[]'::jsonb)
  );
$$;

-- Fan-out de notificação IN-APP: 1 linha por participante, EXCETO o autor da ação.
create or replace function public._tacomp_notificar(
  p_tarefa_id uuid, p_excecao text, p_titulo text, p_corpo text)
returns void language sql security definer set search_path = public as $$
  insert into public.handover_notificacoes(usuario, titulo, corpo, tipo, ref_tipo, ref_id)
  select p.usuario, p_titulo, p_corpo, 'tarefa_acompanhada', 'tarefa_acompanhada', p_tarefa_id
    from public.tarefas_acompanhadas_participantes p
   where p.tarefa_id = p_tarefa_id and p.usuario <> p_excecao;
$$;

-- ------------------------------------------------------------
-- RPCs (anon, validam sessão)
-- ------------------------------------------------------------

-- Promove uma mensagem (grupo_id) a tarefa acompanhada compartilhada.
-- Idempotente: chamar de novo no mesmo grupo NÃO duplica (retorna jaExistia=true).
create or replace function public.handover_acompanhar_criar(
  p_token uuid, p_grupo_id uuid, p_titulo text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  s public.sessoes;
  v_titulo text;
  v_id uuid;
  v_nova boolean := false;
  v_envolvido boolean;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  if p_grupo_id is null then return jsonb_build_object('ok', false, 'erro', 'Grupo inválido.'); end if;

  -- só um envolvido na mensagem (remetente ou destinatário) pode promover
  select exists(
    select 1 from public.tarefas_diretas t
     where t.grupo_id = p_grupo_id and (t.criado_por = s.usuario or t.destinatario = s.usuario)
  ) into v_envolvido;
  if not v_envolvido then return jsonb_build_object('ok', false, 'erro', 'Não autorizado.'); end if;

  -- título: usa o texto da mensagem do grupo se não vier explícito
  v_titulo := nullif(btrim(coalesce(p_titulo, '')), '');
  if v_titulo is null then
    select t.mensagem into v_titulo from public.tarefas_diretas t where t.grupo_id = p_grupo_id limit 1;
  end if;
  v_titulo := coalesce(v_titulo, '(sem título)');

  -- idempotência: grupo_id é UNIQUE
  insert into public.tarefas_acompanhadas(grupo_id, titulo, criado_por, criado_nome)
  values (p_grupo_id, v_titulo, s.usuario, s.nome)
  on conflict (grupo_id) do nothing
  returning id into v_id;

  if v_id is not null then
    v_nova := true;
  else
    select id into v_id from public.tarefas_acompanhadas where grupo_id = p_grupo_id;
  end if;

  if v_nova then
    -- participantes (dedup via PK). Remetente, depois destinatários, depois promotor;
    -- on conflict do nothing → o primeiro papel inserido prevalece, sem repetir usuário.
    insert into public.tarefas_acompanhadas_participantes(tarefa_id, usuario, usuario_nome, papel)
      select v_id, t.criado_por, max(t.criado_nome), 'remetente'
        from public.tarefas_diretas t where t.grupo_id = p_grupo_id
        group by t.criado_por
    on conflict (tarefa_id, usuario) do nothing;

    insert into public.tarefas_acompanhadas_participantes(tarefa_id, usuario, usuario_nome, papel)
      select v_id, t.destinatario, max(t.destinatario_nome), 'destinatario'
        from public.tarefas_diretas t where t.grupo_id = p_grupo_id
        group by t.destinatario
    on conflict (tarefa_id, usuario) do nothing;

    insert into public.tarefas_acompanhadas_participantes(tarefa_id, usuario, usuario_nome, papel)
      values (v_id, s.usuario, s.nome, 'promotor')
    on conflict (tarefa_id, usuario) do nothing;

    insert into public.tarefas_acompanhadas_eventos(tarefa_id, autor, autor_nome, tipo, texto)
      values (v_id, s.usuario, s.nome, 'criacao', null);

    perform public._tacomp_notificar(v_id, s.usuario,
      'Nova tarefa compartilhada', s.nome || ' começou a acompanhar: ' || left(v_titulo, 80));
  end if;

  return jsonb_build_object('ok', true, 'id', v_id, 'jaExistia', not v_nova);
end $$;

-- Lista as tarefas acompanhadas em que SOU participante.
create or replace function public.handover_acompanhar_listar(p_token uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.sessoes; v_tar jsonb;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;

  select coalesce(jsonb_agg(public._tacomp_to_json(r)
           order by (r.status = 'Pendente') desc, r.atualizado_em desc), '[]'::jsonb)
    into v_tar
    from public.tarefas_acompanhadas r
   where exists (select 1 from public.tarefas_acompanhadas_participantes p
                  where p.tarefa_id = r.id and p.usuario = s.usuario);

  return jsonb_build_object('success', true, 'tarefas', v_tar);
end $$;

-- Comentar (qualquer participante). Notifica os demais.
create or replace function public.handover_acompanhar_comentar(p_token uuid, p_id uuid, p_texto text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.sessoes; v_txt text := nullif(btrim(coalesce(p_texto,'')),''); v_titulo text; v_ok boolean;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  if v_txt is null then return jsonb_build_object('ok', false, 'erro', 'Comentário vazio.'); end if;
  select exists(select 1 from public.tarefas_acompanhadas_participantes
                 where tarefa_id = p_id and usuario = s.usuario) into v_ok;
  if not v_ok then return jsonb_build_object('ok', false, 'erro', 'Não autorizado.'); end if;

  insert into public.tarefas_acompanhadas_eventos(tarefa_id, autor, autor_nome, tipo, texto)
    values (p_id, s.usuario, s.nome, 'comentario', v_txt);
  update public.tarefas_acompanhadas set atualizado_em = now() where id = p_id returning titulo into v_titulo;

  perform public._tacomp_notificar(p_id, s.usuario,
    'Novo comentário', s.nome || ' comentou em: ' || left(coalesce(v_titulo,''), 80));
  return jsonb_build_object('ok', true);
end $$;

-- Concluir (qualquer participante). Notifica os demais.
create or replace function public.handover_acompanhar_concluir(p_token uuid, p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.sessoes; v_titulo text; v_ok boolean;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  select exists(select 1 from public.tarefas_acompanhadas_participantes
                 where tarefa_id = p_id and usuario = s.usuario) into v_ok;
  if not v_ok then return jsonb_build_object('ok', false, 'erro', 'Não autorizado.'); end if;

  update public.tarefas_acompanhadas
     set status='Concluído', concluido_por=s.usuario, concluido_nome=s.nome,
         concluido_em=now(), atualizado_em=now()
   where id = p_id returning titulo into v_titulo;

  insert into public.tarefas_acompanhadas_eventos(tarefa_id, autor, autor_nome, tipo, texto)
    values (p_id, s.usuario, s.nome, 'conclusao', null);

  perform public._tacomp_notificar(p_id, s.usuario,
    'Tarefa concluída', s.nome || ' concluiu: ' || left(coalesce(v_titulo,''), 80));
  return jsonb_build_object('ok', true);
end $$;

-- Reabrir (qualquer participante). Notifica os demais.
create or replace function public.handover_acompanhar_reabrir(p_token uuid, p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.sessoes; v_titulo text; v_ok boolean;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  select exists(select 1 from public.tarefas_acompanhadas_participantes
                 where tarefa_id = p_id and usuario = s.usuario) into v_ok;
  if not v_ok then return jsonb_build_object('ok', false, 'erro', 'Não autorizado.'); end if;

  update public.tarefas_acompanhadas
     set status='Pendente', concluido_por=null, concluido_nome=null, concluido_em=null, atualizado_em=now()
   where id = p_id returning titulo into v_titulo;

  insert into public.tarefas_acompanhadas_eventos(tarefa_id, autor, autor_nome, tipo, texto)
    values (p_id, s.usuario, s.nome, 'reabertura', null);

  perform public._tacomp_notificar(p_id, s.usuario,
    'Tarefa reaberta', s.nome || ' reabriu: ' || left(coalesce(v_titulo,''), 80));
  return jsonb_build_object('ok', true);
end $$;

-- Lista minhas notificações IN-APP (recentes) + contador não lidas (badge).
create or replace function public.handover_notificacoes_listar(p_token uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.sessoes; v_list jsonb; v_n int;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'ID', n.id, 'Titulo', n.titulo, 'Corpo', n.corpo, 'Tipo', n.tipo,
           'Ref_Tipo', n.ref_tipo, 'Ref_ID', n.ref_id, 'Lida', n.lida,
           'Criado_Em', to_char(n.criado_em at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI:SS'))
           order by n.criado_em desc), '[]'::jsonb)
    into v_list
    from (select * from public.handover_notificacoes where usuario = s.usuario
           order by criado_em desc limit 100) n;

  select count(*) into v_n from public.handover_notificacoes where usuario = s.usuario and lida = false;

  return jsonb_build_object('success', true, 'notificacoes', v_list, 'naoLidas', v_n);
end $$;

-- Marca notificações como lidas (todas, ou um conjunto de ids meus).
create or replace function public.handover_notificacoes_marcar_lidas(p_token uuid, p_ids uuid[] default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.sessoes;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  if p_ids is null then
    update public.handover_notificacoes set lida = true where usuario = s.usuario and lida = false;
  else
    update public.handover_notificacoes set lida = true where usuario = s.usuario and id = any(p_ids);
  end if;
  return jsonb_build_object('ok', true);
end $$;

-- ------------------------------------------------------------
-- GRANTS + HARDENING
-- O Supabase concede, por DEFAULT PRIVILEGES, EXECUTE/SELECT diretos a
-- anon/authenticated em objetos novos. Por isso "revoke ... from public"
-- NÃO basta — revogamos explicitamente de public, anon E authenticated
-- (mesma lição da migration 0011). Acesso só via RPCs SECURITY DEFINER.
-- ------------------------------------------------------------

-- Helpers internos: ninguém externo executa.
revoke all on function public._tacomp_to_json(public.tarefas_acompanhadas) from public, anon, authenticated;
revoke all on function public._tacomp_notificar(uuid, text, text, text)    from public, anon, authenticated;

-- Tabelas: sem acesso direto por anon/authenticated (RLS é a 2ª camada).
revoke all on table public.tarefas_acompanhadas               from anon, authenticated;
revoke all on table public.tarefas_acompanhadas_participantes from anon, authenticated;
revoke all on table public.tarefas_acompanhadas_eventos       from anon, authenticated;
revoke all on table public.handover_notificacoes              from anon, authenticated;

-- RPCs públicas: revoga amplo, depois concede execução só a anon.
revoke all on function public.handover_acompanhar_criar(uuid, uuid, text)         from public, anon, authenticated;
revoke all on function public.handover_acompanhar_listar(uuid)                    from public, anon, authenticated;
revoke all on function public.handover_acompanhar_comentar(uuid, uuid, text)      from public, anon, authenticated;
revoke all on function public.handover_acompanhar_concluir(uuid, uuid)            from public, anon, authenticated;
revoke all on function public.handover_acompanhar_reabrir(uuid, uuid)             from public, anon, authenticated;
revoke all on function public.handover_notificacoes_listar(uuid)                  from public, anon, authenticated;
revoke all on function public.handover_notificacoes_marcar_lidas(uuid, uuid[])    from public, anon, authenticated;

grant execute on function public.handover_acompanhar_criar(uuid, uuid, text)      to anon;
grant execute on function public.handover_acompanhar_listar(uuid)                 to anon;
grant execute on function public.handover_acompanhar_comentar(uuid, uuid, text)   to anon;
grant execute on function public.handover_acompanhar_concluir(uuid, uuid)         to anon;
grant execute on function public.handover_acompanhar_reabrir(uuid, uuid)          to anon;
grant execute on function public.handover_notificacoes_listar(uuid)               to anon;
grant execute on function public.handover_notificacoes_marcar_lidas(uuid, uuid[]) to anon;
