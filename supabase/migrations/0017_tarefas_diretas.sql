-- ============================================================
-- 0017_tarefas_diretas.sql
-- Mensagens-tarefa diretas entre usuários (checklist à parte):
-- alguém envia uma tarefa para outra pessoa (ou "Todos"); ela cai na
-- caixa de Recebidas, pode responder (thread) ou marcar Concluído.
-- Modelo de segurança padrão: RLS habilitado sem policy; acesso só via
-- RPCs SECURITY DEFINER que validam a sessão.
-- ============================================================

create table if not exists public.tarefas_diretas (
  id                uuid primary key default gen_random_uuid(),
  grupo_id          uuid,
  criado_por        text not null,
  criado_nome       text,
  destinatario      text not null,
  destinatario_nome text,
  mensagem          text not null,
  status            text not null default 'Pendente',
  lido              boolean not null default false,
  criado_em         timestamptz not null default now(),
  concluido_em      timestamptz,
  concluido_por     text
);
alter table public.tarefas_diretas enable row level security;
create index if not exists idx_tarefas_dest on public.tarefas_diretas(destinatario, status);
create index if not exists idx_tarefas_criador on public.tarefas_diretas(criado_por);

create table if not exists public.tarefas_respostas (
  id          uuid primary key default gen_random_uuid(),
  tarefa_id   uuid not null references public.tarefas_diretas(id) on delete cascade,
  autor       text not null,
  autor_nome  text,
  texto       text not null,
  criado_em   timestamptz not null default now()
);
alter table public.tarefas_respostas enable row level security;
create index if not exists idx_tarefas_resp on public.tarefas_respostas(tarefa_id, criado_em);

-- ---------- helper interno: serializa uma tarefa + respostas ----------
create or replace function public._tarefa_to_json(r public.tarefas_diretas)
returns jsonb language sql stable set search_path = public as $$
  select jsonb_build_object(
    'ID', r.id, 'Grupo_ID', r.grupo_id,
    'Criado_Por', r.criado_por, 'Criado_Nome', r.criado_nome,
    'Destinatario', r.destinatario, 'Destinatario_Nome', r.destinatario_nome,
    'Mensagem', r.mensagem, 'Status', r.status, 'Lido', r.lido,
    'Criado_Em', to_char(r.criado_em at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI:SS'),
    'Concluido_Em', case when r.concluido_em is null then null
                         else to_char(r.concluido_em at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI:SS') end,
    'Concluido_Por', r.concluido_por,
    'Respostas', coalesce((
      select jsonb_agg(jsonb_build_object(
               'Autor', x.autor, 'Autor_Nome', x.autor_nome, 'Texto', x.texto,
               'Criado_Em', to_char(x.criado_em at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI:SS'))
             order by x.criado_em asc)
      from public.tarefas_respostas x where x.tarefa_id = r.id), '[]'::jsonb)
  );
$$;

-- ---------- criar tarefa (1 pessoa, várias, ou Todos) ----------
create or replace function public.handover_tarefa_criar(
  p_token uuid, p_destinatarios text[], p_mensagem text, p_todos boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  s public.sessoes;
  v_msg text := nullif(btrim(coalesce(p_mensagem,'')), '');
  v_grupo uuid := gen_random_uuid();
  v_n int := 0;
  u record;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  if v_msg is null then return jsonb_build_object('ok', false, 'erro', 'Mensagem vazia.'); end if;

  if coalesce(p_todos, false) then
    for u in select usuario, nome from public.usuarios
             where ativo = true and usuario <> s.usuario loop
      insert into public.tarefas_diretas(grupo_id, criado_por, criado_nome, destinatario, destinatario_nome, mensagem)
      values (v_grupo, s.usuario, s.nome, u.usuario, u.nome, v_msg);
      v_n := v_n + 1;
    end loop;
  else
    for u in select usuario, nome from public.usuarios
             where ativo = true and usuario <> s.usuario
               and usuario = any (select public.norm_usuario(d) from unnest(coalesce(p_destinatarios,'{}')) d) loop
      insert into public.tarefas_diretas(grupo_id, criado_por, criado_nome, destinatario, destinatario_nome, mensagem)
      values (v_grupo, s.usuario, s.nome, u.usuario, u.nome, v_msg);
      v_n := v_n + 1;
    end loop;
  end if;

  if v_n = 0 then return jsonb_build_object('ok', false, 'erro', 'Nenhum destinatário válido.'); end if;
  return jsonb_build_object('ok', true, 'enviadas', v_n);
end $$;

-- ---------- listar: recebidas, enviadas, contador de não lidas ----------
create or replace function public.handover_tarefas_listar(p_token uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  s public.sessoes;
  v_receb jsonb;
  v_env jsonb;
  v_nlidas int;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;

  select coalesce(jsonb_agg(public._tarefa_to_json(t)
           order by (t.status = 'Pendente') desc, t.criado_em desc), '[]'::jsonb)
    into v_receb from public.tarefas_diretas t where t.destinatario = s.usuario;

  select coalesce(jsonb_agg(public._tarefa_to_json(t)
           order by t.criado_em desc), '[]'::jsonb)
    into v_env from public.tarefas_diretas t where t.criado_por = s.usuario;

  select count(*) into v_nlidas from public.tarefas_diretas
   where destinatario = s.usuario and lido = false;

  return jsonb_build_object('success', true, 'recebidas', v_receb, 'enviadas', v_env, 'naoLidas', v_nlidas);
end $$;

-- ---------- responder (remetente ou destinatário) ----------
create or replace function public.handover_tarefa_responder(p_token uuid, p_tarefa_id uuid, p_texto text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.sessoes; t public.tarefas_diretas; v_txt text := nullif(btrim(coalesce(p_texto,'')),'');
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  if v_txt is null then return jsonb_build_object('ok', false, 'erro', 'Resposta vazia.'); end if;
  select * into t from public.tarefas_diretas where id = p_tarefa_id;
  if t.id is null then return jsonb_build_object('ok', false, 'erro', 'Tarefa não encontrada.'); end if;
  if s.usuario <> t.criado_por and s.usuario <> t.destinatario then
    return jsonb_build_object('ok', false, 'erro', 'Não autorizado.');
  end if;
  insert into public.tarefas_respostas(tarefa_id, autor, autor_nome, texto)
    values (t.id, s.usuario, s.nome, v_txt);
  -- resposta do remetente reativa "não lida" para o destinatário ver
  if s.usuario = t.criado_por then
    update public.tarefas_diretas set lido = false where id = t.id;
  end if;
  return jsonb_build_object('ok', true);
end $$;

-- ---------- concluir (só destinatário) / reabrir (qualquer dos dois) ----------
create or replace function public.handover_tarefa_concluir(p_token uuid, p_tarefa_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.sessoes; t public.tarefas_diretas;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  select * into t from public.tarefas_diretas where id = p_tarefa_id;
  if t.id is null or s.usuario <> t.destinatario then
    return jsonb_build_object('ok', false, 'erro', 'Não autorizado.');
  end if;
  update public.tarefas_diretas
     set status='Concluído', concluido_em=now(), concluido_por=s.nome, lido=true
   where id = t.id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.handover_tarefa_reabrir(p_token uuid, p_tarefa_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.sessoes; t public.tarefas_diretas;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  select * into t from public.tarefas_diretas where id = p_tarefa_id;
  if t.id is null or (s.usuario <> t.destinatario and s.usuario <> t.criado_por) then
    return jsonb_build_object('ok', false, 'erro', 'Não autorizado.');
  end if;
  update public.tarefas_diretas set status='Pendente', concluido_em=null, concluido_por=null where id = t.id;
  return jsonb_build_object('ok', true);
end $$;

-- ---------- marcar minhas recebidas como lidas (badge) ----------
create or replace function public.handover_tarefas_marcar_lidas(p_token uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.sessoes;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  update public.tarefas_diretas set lido = true where destinatario = s.usuario and lido = false;
  return jsonb_build_object('ok', true);
end $$;

-- ---------- grants ----------
revoke all on function public._tarefa_to_json(public.tarefas_diretas)             from public;
revoke all on function public.handover_tarefa_criar(uuid, text[], text, boolean)  from public;
revoke all on function public.handover_tarefas_listar(uuid)                       from public;
revoke all on function public.handover_tarefa_responder(uuid, uuid, text)         from public;
revoke all on function public.handover_tarefa_concluir(uuid, uuid)               from public;
revoke all on function public.handover_tarefa_reabrir(uuid, uuid)                from public;
revoke all on function public.handover_tarefas_marcar_lidas(uuid)               from public;
grant execute on function public.handover_tarefa_criar(uuid, text[], text, boolean) to anon;
grant execute on function public.handover_tarefas_listar(uuid)                      to anon;
grant execute on function public.handover_tarefa_responder(uuid, uuid, text)        to anon;
grant execute on function public.handover_tarefa_concluir(uuid, uuid)              to anon;
grant execute on function public.handover_tarefa_reabrir(uuid, uuid)               to anon;
grant execute on function public.handover_tarefas_marcar_lidas(uuid)              to anon;
