// Handover v2 — Fluxo de primeiro acesso (registro via convite)

import { db, rpcError } from './api.js';
import { el } from './utils.js';
import { G, TKEY, SKEY } from './state.js';

// ── Alternar entre login e primeiro acesso ──
export function toggleToRegistro() {
  el('handover-login-overlay').classList.add('hidden');
  el('primeiro-acesso-overlay').classList.remove('hidden');
  el('pri-nome').focus();
}

export function toggleToLogin() {
  el('primeiro-acesso-overlay').classList.add('hidden');
  el('handover-login-overlay').classList.remove('hidden');
  el('handover-login-usuario').focus();
  limparErroRegistro();
}

function limparErroRegistro() {
  el('primeiro-acesso-error').textContent = '';
}

// ── Validar form do registro ──
function validarRegistro() {
  const nome = el('pri-nome').value.trim();
  const pin = el('pri-pin').value.trim();
  const pinConfirm = el('pri-pin-confirm').value.trim();
  const codigo = el('pri-codigo-convite').value.trim().toUpperCase();

  // Validar nome (3-50 chars)
  if (nome.length < 3 || nome.length > 50) {
    return 'Nome deve ter 3-50 caracteres.';
  }

  // Validar PIN (4-8 dígitos)
  if (!/^\d{4,8}$/.test(pin)) {
    return 'PIN deve ter 4-8 dígitos.';
  }

  // Validar confirmação
  if (pin !== pinConfirm) {
    return 'PINs não conferem.';
  }

  // Validar código (8-12 chars alphanumeric)
  if (!/^[A-Z0-9]{8,12}$/.test(codigo)) {
    return 'Código de convite inválido (8-12 caracteres).';
  }

  return null; // OK
}

// ── Realizar registro ──
export async function doRegistro() {
  const err = el('primeiro-acesso-error');
  err.textContent = '';

  // Validar form
  const errMsg = validarRegistro();
  if (errMsg) {
    err.textContent = errMsg;
    return;
  }

  const nome = el('pri-nome').value.trim();
  const pin = el('pri-pin').value.trim();
  const codigo = el('pri-codigo-convite').value.trim().toUpperCase();

  const btn = el('primeiro-acesso-submit');
  btn.disabled = true;
  btn.textContent = 'Registrando…';

  try {
    const res = await db.rpc('handover_convite_registrar', {
      p_codigo: codigo,
      p_nome: nome,
      p_pin: pin
    });

    if (res.error) throw res.error;
    const d = res.data;

    if (!d || !d.success) {
      err.textContent = (d && d.erro) || 'Erro ao registrar. Tente novamente.';
      return;
    }

    // Sucesso — seta token e sessão
    G.token = d.token;
    G.sessao = { usuario: d.usuario, nome: d.nome, perfil: d.perfil };
    localStorage.setItem(TKEY, G.token);
    localStorage.setItem(SKEY, JSON.stringify(G.sessao));

    // Limpar PIN do DOM
    el('pri-pin').value = '';
    el('pri-pin-confirm').value = '';

    // Importar e chamar abrirApp
    const { abrirApp } = await import('./dashboard.js');
    abrirApp();
  } catch (e) {
    err.textContent = (e && e.message) || 'Erro de conexão.';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Registrar';
  }
}

// ── Event listeners ──
export function setupRegistroListeners() {
  // Alternancia de telas
  el('handover-primeiro-acesso-toggle').addEventListener('click', toggleToRegistro);
  el('primeiro-acesso-voltar').addEventListener('click', toggleToLogin);

  // Submit do registro
  el('primeiro-acesso-submit').addEventListener('click', doRegistro);

  // Enter em campos
  el('pri-nome').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') el('pri-pin').focus();
  });
  el('pri-pin').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') el('pri-pin-confirm').focus();
  });
  el('pri-pin-confirm').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') el('pri-codigo-convite').focus();
  });
  el('pri-codigo-convite').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') doRegistro();
  });

  // Uppercase no código
  el('pri-codigo-convite').addEventListener('input', function() {
    this.value = this.value.toUpperCase();
  });

  // Limpar erro ao digitar
  el('pri-nome').addEventListener('input', limparErroRegistro);
  el('pri-pin').addEventListener('input', limparErroRegistro);
  el('pri-pin-confirm').addEventListener('input', limparErroRegistro);
  el('pri-codigo-convite').addEventListener('input', limparErroRegistro);
}
