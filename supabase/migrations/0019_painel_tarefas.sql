-- ============================================================
-- 0019_painel_tarefas.sql
-- Painel de tarefas pessoal de cada usuário. Pode-se promover uma
-- mensagem recebida (ou um item da thread) a tarefa, ou criar uma nota
-- pessoal. A tarefa é "tracked" por quem pediu (solicitante); ao concluir,
-- o solicitante é avisado (toast + badge via polling).
-- Segurança padrão: RLS sem policy; acesso só via RPCs definer.
-- ============================================================

create table if not exists public.painel_tarefas (
  id                uuid primary key default gen_random_uuid(),
  usuario           text not null,          -- dono do painel
  usuario_nome      text,
  texto             text not null,          -- texto (personalizável)
  origem_tarefa_id  uuid,                    -- mensagem de origem (tarefas_diretas.id)
  origem_tipo       text default 'manual',   -- 'mensagem' | 'resposta' | 'manual'
  solicitante       text,                    -- quem pediu (null = nota pessoal)
  solicitante_nome  text,
  status            text not null default 'Pendente',
  aviso_lido        boolean not null default false, -- solicitante já viu a conclusão?
  criado_em         timestamptz not null default now(),
  concluido_em      timestamptz
);
alter table public.painel_tarefas enable row level security;
create index if not exists idx_painel_usuario on public.painel_tarefas(usuario, status);
create index if not exists idx_painel_solic on public.painel_tarefas(solicitante, status, aviso_lido);

create or replace function public._painel_to_json(r public.painel_tarefas)
returns jsonb language sql stable set search_path = public as $$
  select jsonb_build_object(
    'ID', r.id, 'Texto', r.texto,
    'Origem_Tipo', r.origem_tipo, 'Origem_Tarefa_ID', r.origem_tarefa_id,
    'Usuario', r.usuario, 'Usuario_Nome', r.usuario_nome,
    'Solicitante', r.solicitante, 'Solicitante_Nome', r.solicitante_nome,
    'Status', r.status,
    'Criado_Em', to_char(r.criado_em at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI:SS'),
    'Concluido_Em', case when r.concluido_em is null then null
                         else to_char(r.concluido_em at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI:SS') end);
$$;

-- ---------- criar tarefa no painel ----------
create or replace function public.handover_painel_criar(
  p_token uuid, p_texto text, p_origem_tarefa_id uuid default null, p_origem_tipo text default 'manual')
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  s public.sessoes;
  v_txt text := nullif(btrim(coalesce(p_texto,'')), '');
  v_solic text := null; v_solic_nome text := null; v_tipo text := coalesce(nullif(btrim(p_origem_tipo),''),'manual');
  v_oid uuid := null;
  t public.tarefas_diretas;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  if v_txt is null then return jsonb_build_object('ok', false, 'erro', 'Texto vazio.'); end if;

  if p_origem_tarefa_id is not null then
    select * into t from public.tarefas_diretas where id = p_origem_tarefa_id;
    -- só posso promover mensagens que EU recebi
    if t.id is not null and t.destinatario = s.usuario then
      v_oid := t.id; v_solic := t.criado_por; v_solic_nome := t.criado_nome;
    else
      v_tipo := 'manual';
    end if;
  else
    v_tipo := 'manual';
  end if;

  insert into public.painel_tarefas(usuario, usuario_nome, texto, origem_tarefa_id, origem_tipo, solicitante, solicitante_nome)
  values (s.usuario, s.nome, v_txt, v_oid, v_tipo, v_solic, v_solic_nome);
  return jsonb_build_object('ok', true);
end $$;

-- ---------- listar meu painel + avisos (tarefas que pedi e foram concluídas) ----------
create or replace function public.handover_painel_listar(p_token uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.sessoes; v_tar jsonb; v_avi jsonb; v_n int;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;

  select coalesce(jsonb_agg(public._painel_to_json(p)
           order by (p.status = 'Pendente') desc, p.criado_em desc), '[]'::jsonb)
    into v_tar from public.painel_tarefas p where p.usuario = s.usuario;

  select coalesce(jsonb_agg(public._painel_to_json(p)
           order by p.concluido_em desc), '[]'::jsonb)
    into v_avi from public.painel_tarefas p
   where p.solicitante = s.usuario and p.status = 'Concluído' and p.aviso_lido = false;

  select count(*) into v_n from public.painel_tarefas
   where solicitante = s.usuario and status = 'Concluído' and aviso_lido = false;

  return jsonb_build_object('success', true, 'tarefas', v_tar, 'avisos', v_avi, 'naoAck', v_n);
end $$;

create or replace function public.handover_painel_concluir(p_token uuid, p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.sessoes; p public.painel_tarefas;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  select * into p from public.painel_tarefas where id = p_id;
  if p.id is null or p.usuario <> s.usuario then return jsonb_build_object('ok', false, 'erro', 'Não autorizado.'); end if;
  update public.painel_tarefas set status='Concluído', concluido_em=now(), aviso_lido=false where id = p_id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.handover_painel_reabrir(p_token uuid, p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.sessoes; p public.painel_tarefas;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  select * into p from public.painel_tarefas where id = p_id;
  if p.id is null or p.usuario <> s.usuario then return jsonb_build_object('ok', false, 'erro', 'Não autorizado.'); end if;
  update public.painel_tarefas set status='Pendente', concluido_em=null, aviso_lido=true where id = p_id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.handover_painel_remover(p_token uuid, p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.sessoes; p public.painel_tarefas;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  select * into p from public.painel_tarefas where id = p_id;
  if p.id is null or p.usuario <> s.usuario then return jsonb_build_object('ok', false, 'erro', 'Não autorizado.'); end if;
  delete from public.painel_tarefas where id = p_id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.handover_painel_avisos_ack(p_token uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.sessoes;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  update public.painel_tarefas set aviso_lido = true
   where solicitante = s.usuario and status = 'Concluído' and aviso_lido = false;
  return jsonb_build_object('ok', true);
end $$;

-- ---------- grants ----------
revoke all on function public._painel_to_json(public.painel_tarefas)                   from public;
revoke all on function public.handover_painel_criar(uuid, text, uuid, text)            from public;
revoke all on function public.handover_painel_listar(uuid)                             from public;
revoke all on function public.handover_painel_concluir(uuid, uuid)                     from public;
revoke all on function public.handover_painel_reabrir(uuid, uuid)                      from public;
revoke all on function public.handover_painel_remover(uuid, uuid)                      from public;
revoke all on function public.handover_painel_avisos_ack(uuid)                         from public;
grant execute on function public.handover_painel_criar(uuid, text, uuid, text)         to anon;
grant execute on function public.handover_painel_listar(uuid)                          to anon;
grant execute on function public.handover_painel_concluir(uuid, uuid)                  to anon;
grant execute on function public.handover_painel_reabrir(uuid, uuid)                   to anon;
grant execute on function public.handover_painel_remover(uuid, uuid)                   to anon;
grant execute on function public.handover_painel_avisos_ack(uuid)                      to anon;
