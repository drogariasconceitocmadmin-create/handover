-- ============================================================
-- 0015_comprador_listar_status.sql
-- Lista para o comprador os itens já marcados como 'Cancelado' ou
-- 'Não encontrado', para permitir reverter/comprar em caso de erro.
-- Mesma forma de retorno de handover_compras_listar (§ migration 0006).
-- ============================================================
create or replace function public.handover_compras_listar_status(p_token uuid, p_status text)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $fn$
declare
  s public.sessoes;
  v_st text := btrim(coalesce(p_status, ''));
  v_medicamentos jsonb;
  v_compras jsonb;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  if s.perfil not in ('comprador','gerente','admin') then raise exception 'nao_autorizado'; end if;
  if v_st not in ('Cancelado','Não encontrado') then raise exception 'status_invalido'; end if;

  select coalesce(jsonb_agg(public._medicamento_to_json(m)
                            order by m.ultima_acao_em desc nulls last, m.criado_em desc), '[]'::jsonb)
    into v_medicamentos
    from public.medicamentos m
   where m.status = v_st;

  select coalesce(jsonb_agg(public._compras_reposicao_to_json(c)
                            order by c.ultima_acao_em desc nulls last, c.data_solicitacao desc), '[]'::jsonb)
    into v_compras
    from public.compras_reposicao c
   where c.status_compra = v_st;

  return jsonb_build_object('success', true,
    'medicamentos', v_medicamentos, 'comprasReposicao', v_compras);
end;
$fn$;

revoke all on function public.handover_compras_listar_status(uuid, text) from public;
grant execute on function public.handover_compras_listar_status(uuid, text) to anon;
