-- ============================================================
-- 0016_auditoria_item.sql
-- Trilha completa de auditoria de um item (todos os eventos), p/ o
-- "Ver trilha" do Histórico. Ordem cronológica (mais antigo -> mais novo).
-- ============================================================
create or replace function public.handover_auditoria_item(p_token uuid, p_id_item uuid)
returns jsonb
language plpgsql security definer set search_path = public as $fn$
declare
  s public.sessoes;
  v jsonb;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
            'ID_Auditoria',   a.id_auditoria,
            'Data_Hora',      to_char(a.data_hora at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI:SS'),
            'Acao',           a.acao,
            'Origem',         a.origem,
            'Usuario',        a.usuario,
            'Nome',           a.nome,
            'Perfil',         a.perfil,
            'Campo',          a.campo,
            'Valor_Anterior', a.valor_anterior,
            'Valor_Novo',     a.valor_novo,
            'Resumo',         a.resumo)
          order by a.data_hora asc), '[]'::jsonb)
    into v
    from public.auditoria a
   where a.id_item = p_id_item;

  return jsonb_build_object('success', true, 'trilha', v);
end;
$fn$;

revoke all on function public.handover_auditoria_item(uuid, uuid) from public;
grant execute on function public.handover_auditoria_item(uuid, uuid) to anon;
