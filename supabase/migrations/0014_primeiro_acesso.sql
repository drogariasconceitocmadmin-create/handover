-- ============================================================
-- 0014_primeiro_acesso.sql
-- Auto-onboarding: funcionário sem PIN define o próprio PIN (4 dígitos)
-- no primeiro acesso e já entra. Dois RPCs anon-calláveis:
--   1) handover_usuarios_sem_pin()  -> lista nomes ainda sem PIN
--   2) handover_primeiro_acesso()   -> define PIN só se ainda não existir
-- Idempotente (create or replace). pgcrypto vive em `extensions`,
-- por isso search_path = public, extensions (ver 0003).
-- ============================================================

-- 1) Lista de usuários ativos que AINDA não definiram PIN.
--    Retorna só usuario + nome (nada sensível). Anon pode chamar.
create or replace function public.handover_usuarios_sem_pin()
returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(
    jsonb_agg(jsonb_build_object('Usuario', usuario, 'Nome', nome) order by nome),
    '[]'::jsonb)
  from public.usuarios
  where ativo = true
    and (pin_hash is null or pin_hash = '');
$$;

-- 2) Primeiro acesso: define o PIN apenas se o usuário ainda não tem um.
--    Bloqueia se o usuário já possui PIN (evita sequestro de conta).
--    Em sucesso, cria a sessão e retorna o token (entra direto).
create or replace function public.handover_primeiro_acesso(p_usuario text, p_pin text)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  u public.usuarios;
  s public.sessoes;
begin
  if p_pin !~ '^\d{4}$' then
    return jsonb_build_object('ok', false, 'erro', 'O PIN deve ter 4 dígitos.');
  end if;

  select * into u from public.usuarios
   where usuario = norm_usuario(p_usuario) and ativo = true;

  if u.id is null then
    return jsonb_build_object('ok', false, 'erro', 'Usuário não encontrado.');
  end if;

  if u.pin_hash is not null and u.pin_hash <> '' then
    return jsonb_build_object('ok', false,
      'erro', 'Este usuário já tem acesso. Faça login normalmente.');
  end if;

  update public.usuarios
     set pin_hash = crypt(p_pin, gen_salt('bf')),
         tentativas_falhas = 0, bloqueado_ate = null, ultimo_login_em = now()
   where id = u.id;

  insert into public.sessoes (usuario_id, usuario, nome, perfil)
    values (u.id, u.usuario, u.nome, u.perfil) returning * into s;

  return jsonb_build_object('ok', true, 'token', s.token,
    'usuario', u.usuario, 'nome', u.nome, 'perfil', u.perfil);
end $$;

-- ---- Grants: revoga default e concede execução ao anon ----
revoke all on function public.handover_usuarios_sem_pin()                 from public;
revoke all on function public.handover_primeiro_acesso(text, text)        from public;
grant execute on function public.handover_usuarios_sem_pin()              to anon;
grant execute on function public.handover_primeiro_acesso(text, text)     to anon;
