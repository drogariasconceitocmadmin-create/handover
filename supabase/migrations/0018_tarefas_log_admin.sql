-- ============================================================
-- 0018_tarefas_log_admin.sql
-- Log/auditoria de TODAS as mensagens-tarefa, só para admin.
-- ============================================================
create or replace function public.handover_tarefas_log(p_token uuid, p_limit integer default 300)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.sessoes; v jsonb;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  if s.perfil <> 'admin' then raise exception 'nao_autorizado'; end if;

  select coalesce(jsonb_agg(j order by ord desc), '[]'::jsonb) into v
  from (
    select public._tarefa_to_json(t) as j, t.criado_em as ord
    from public.tarefas_diretas t
    order by t.criado_em desc
    limit greatest(1, least(coalesce(p_limit, 300), 1000))
  ) q;

  return jsonb_build_object('success', true, 'log', v);
end $$;

revoke all on function public.handover_tarefas_log(uuid, integer) from public;
grant execute on function public.handover_tarefas_log(uuid, integer) to anon;
