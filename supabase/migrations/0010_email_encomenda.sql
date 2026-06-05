-- Handover v2 — Migration 0010: e-mail automático de Encomenda (Edge Function via pg_net)
--
-- Objetivo (SPEC §8):
--   Ao inserir uma linha em public.medicamentos com tipo = 'Encomenda', disparar um
--   POST HTTP assíncrono para a Edge Function `enviar-encomenda-email`, que envia o
--   e-mail (Resend) para drogariasconceitocm@gmail.com com os dados do pedido.
--
-- Convenções (SPEC §1): função interna (_-helper, sem grant a anon), security definer
--   set search_path = public, extensions (necessário p/ pg_net, que vive em `extensions`).
--   Tabelas já têm RLS habilitada nas migrations anteriores; aqui não criamos tabelas.
--   SQL idempotente (create extension if not exists / create or replace / drop trigger if exists).
--
-- ─────────────────────────────────────────────────────────────────────────────
-- DEPENDÊNCIAS DE DEPLOY (PREENCHER ANTES / DURANTE O DEPLOY):
--
--   1) SECRET DA EDGE FUNCTION (provedor de e-mail):
--        supabase secrets set RESEND_API_KEY=<sua_chave_resend>
--      A function `enviar-encomenda-email` lê RESEND_API_KEY do env (Deno.env).
--
--   2) verify_jwt = false NA EDGE FUNCTION:
--      O POST vem do banco (pg_net) sem um JWT de usuário; a function precisa aceitar
--      a chamada. No deploy use:
--        supabase functions deploy enviar-encomenda-email --no-verify-jwt
--      (ou config.toml: [functions.enviar-encomenda-email]  verify_jwt = false)
--
--   3) HEADER Authorization NESTE ARQUIVO (placeholder abaixo):
--      Substitua  COLE_AQUI_O_SERVICE_ROLE_OU_ANON_KEY_NO_DEPLOY  pela chave do projeto
--      (service_role recomendado; ou anon key). Como a function roda com verify_jwt=false,
--      o header não é estritamente validado, mas é enviado por compatibilidade e para
--      logs/observabilidade. NUNCA versionar a chave real — preencher só no ambiente.
--      Alternativa mais segura: guardar a chave num parâmetro de banco e ler via
--      current_setting(...) — mantido como placeholder literal por simplicidade do deploy.
-- ─────────────────────────────────────────────────────────────────────────────

-- pg_net: cliente HTTP assíncrono dentro do Postgres. No Supabase suas funções vivem no
-- schema `net` (ex.: net.http_post), por isso são qualificadas explicitamente abaixo.
create extension if not exists pg_net;

-- ============================================================================
-- Trigger function: monta o payload (chaves PascalCase = headers, SPEC §2) e faz
-- o POST para a Edge Function. Falha de rede NÃO deve quebrar o insert do pedido,
-- então erros do http_post são capturados e apenas logados (warning).
-- ============================================================================
create or replace function public._notificar_encomenda_email()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $fn$
declare
  v_url     text := 'https://pxswpufbkisdniojwdtt.supabase.co/functions/v1/enviar-encomenda-email';
  -- DEPLOY: trocar o placeholder pela chave real (service_role/anon). Ver cabeçalho.
  v_bearer  text := 'COLE_AQUI_O_SERVICE_ROLE_OU_ANON_KEY_NO_DEPLOY';
  v_body    jsonb;
begin
  -- Corpo em PascalCase, espelhando os headers das planilhas (SPEC §2) e os campos
  -- exigidos pelo e-mail de encomenda (SPEC §8): ID, Medicamento, Cliente, Atendente,
  -- Pre_Pago, Previsao_Entrega.
  v_body := jsonb_build_object(
    'ID',                new.id,
    'Medicamento',       new.medicamento,
    'Cliente',           new.cliente,
    'Atendente',         new.atendente,
    'Pre_Pago',          coalesce(new.pre_pago, false),
    'Previsao_Entrega',  case when new.previsao_entrega is null then null
                              else to_char(new.previsao_entrega, 'YYYY-MM-DD') end
  );

  begin
    perform net.http_post(
      url     := v_url,
      headers := jsonb_build_object(
                   'Content-Type',  'application/json',
                   'Authorization', 'Bearer ' || v_bearer
                 ),
      body    := v_body
    );
  exception when others then
    -- Nunca bloquear a criação do pedido por falha de e-mail.
    raise warning 'enviar-encomenda-email: falha ao enfileirar http_post (id=%): %',
      new.id, sqlerrm;
  end;

  return new;
end;
$fn$;

-- Função interna: revoga o execute default do PUBLIC; sem grant a anon (SPEC §1).
revoke all on function public._notificar_encomenda_email() from public;

-- ============================================================================
-- Trigger: dispara apenas para Encomendas, após o insert.
-- ============================================================================
drop trigger if exists trg_notificar_encomenda_email on public.medicamentos;
create trigger trg_notificar_encomenda_email
  after insert on public.medicamentos
  for each row
  when (new.tipo = 'Encomenda')
  execute function public._notificar_encomenda_email();
