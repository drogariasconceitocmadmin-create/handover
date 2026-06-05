-- Handover v2 — Migration 0013: normalização PT-BR de nomes e medicamentos
--
-- Regra de negócio: independentemente de como o operador digitar (CAIXA ALTA,
-- minúscula ou mista), o sistema padroniza a escrita ao montar a mensagem de
-- WhatsApp (e qualquer saída derivada). Corrige casos como "olá, kelly!" → "Olá, Kelly!".
--
-- Conteúdo:
--   * _norm_nome_ptbr(text)  — Title Case com preposições/artigos PT-BR em minúsculo no meio.
--   * _norm_med_ptbr(text)   — Title Case farmacêutico: tokens com dígito (500mg, 400/57mg)
--                              ficam minúsculos preservando números; segmentos com '+'
--                              (Amox+Clav) recebem Title Case por parte.
--   * _medicamento_whatsapp_msg — passa cliente/medicamento pelas funções acima.
--
-- Convenções (SPEC §1): funções com set search_path = public, extensions; helpers internas
-- sem grant a anon. Idempotente (create or replace).

-- ── Normalizador de nome próprio (Title Case PT-BR) ──
create or replace function public._norm_nome_ptbr(p_str text)
returns text
language plpgsql immutable set search_path = public, extensions as $$
declare
  v_words  text[];
  v_result text[] := '{}';
  v_word   text;
  v_preps  text[] := array['de','da','do','dos','das','e','a','o','em',
                            'com','por','para','sem','sob','ao','à',
                            'no','na','nos','nas','num','numa'];
  i int;
begin
  if p_str is null or btrim(p_str) = '' then return p_str; end if;
  v_words := string_to_array(regexp_replace(btrim(p_str), '\s+', ' ', 'g'), ' ');
  for i in 1 .. array_length(v_words, 1) loop
    v_word := v_words[i];
    if v_word = '' then continue; end if;
    if i > 1 and lower(v_word) = any(v_preps) then
      v_result := array_append(v_result, lower(v_word));
    else
      v_result := array_append(v_result,
        upper(left(lower(v_word), 1)) || right(lower(v_word), -1));
    end if;
  end loop;
  return array_to_string(v_result, ' ');
end;
$$;

-- ── Normalizador de medicamento (Title Case farmacêutico) ──
create or replace function public._norm_med_ptbr(p_str text)
returns text
language plpgsql immutable set search_path = public, extensions as $$
declare
  v_words  text[];
  v_result text[] := '{}';
  v_word   text;
  v_preps  text[] := array['de','da','do','dos','das','e','com','para','sem'];
  v_seg    text;
  v_parts  text[];
  v_segs   text[] := '{}';
  i int;
begin
  if p_str is null or btrim(p_str) = '' then return p_str; end if;
  v_words := string_to_array(regexp_replace(btrim(p_str), '\s+', ' ', 'g'), ' ');
  for i in 1 .. array_length(v_words, 1) loop
    v_word := v_words[i];
    if v_word = '' then continue; end if;
    -- Token com dígito → lowercase todas as letras (preserva números)
    if v_word ~ '\d' then
      v_result := array_append(v_result, lower(v_word));
    -- Token com + → Title Case em cada parte separada por +
    elsif v_word ~ '\+' then
      v_parts := string_to_array(lower(v_word), '+');
      v_segs  := '{}';
      foreach v_seg in array v_parts loop
        v_segs := array_append(v_segs, upper(left(v_seg, 1)) || right(v_seg, -1));
      end loop;
      v_result := array_append(v_result, array_to_string(v_segs, '+'));
    -- Preposição no meio
    elsif i > 1 and lower(v_word) = any(v_preps) then
      v_result := array_append(v_result, lower(v_word));
    else
      v_result := array_append(v_result,
        upper(left(lower(v_word), 1)) || right(lower(v_word), -1));
    end if;
  end loop;
  return array_to_string(v_result, ' ');
end;
$$;

-- ── Mensagem de WhatsApp com nome/medicamento normalizados ──
create or replace function public._medicamento_whatsapp_msg(r public.medicamentos)
returns text
language plpgsql immutable set search_path = public, extensions as $$
declare
  v_nome  text := public._norm_nome_ptbr(coalesce(nullif(btrim(r.cliente),''), 'cliente'));
  v_med   text := public._norm_med_ptbr(coalesce(nullif(btrim(r.medicamento),''), 'seu medicamento'));
  v_forma text := coalesce(r.forma_recebimento, '');
  v_msg   text;
begin
  v_msg := 'Olá, ' || v_nome || '!' || E'\n\n';
  v_msg := v_msg || 'Passando para avisar que ' || v_med
                 || ' já está disponível em nossa farmácia. ';
  if v_forma = 'Retira na loja' then
    v_msg := v_msg || 'Você pode retirar na loja quando for melhor para você. '
                   || 'Estamos à disposição!';
  elsif v_forma = 'Entregar no endereço cadastrado' then
    v_msg := v_msg || 'Vamos providenciar a entrega no endereço cadastrado. '
                   || 'Qualquer dúvida, estamos à disposição!';
  else
    v_msg := v_msg || 'Como prefere receber? Podemos combinar a retirada na loja '
                   || 'ou a entrega no seu endereço. Estamos à disposição!';
  end if;
  return v_msg;
end;
$$;

-- ── Grants: helpers internas, sem acesso anon ──
revoke all on function public._norm_nome_ptbr(text) from public;
revoke all on function public._norm_med_ptbr(text)  from public;
revoke all on function public._medicamento_whatsapp_msg(public.medicamentos) from public;
