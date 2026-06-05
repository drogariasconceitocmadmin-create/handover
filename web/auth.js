/* Handover v2 — autenticação por PIN (login/logout). */
import { G, TKEY, SKEY } from './state.js';
import { db } from './api.js';
import { el } from './utils.js';
import { abrirApp } from './dashboard.js';

export async function doLogin() {
  var u = el('handover-login-usuario').value.trim();
  var p = el('handover-login-pin').value.trim();
  var err = el('handover-login-error');
  err.textContent = '';
  if (!u || !p) { err.textContent = 'Informe usuário e PIN.'; return; }
  var btn = el('handover-login-submit');
  btn.disabled = true; btn.textContent = 'Entrando…';
  try {
    var res = await db.rpc('handover_login', { p_usuario: u, p_pin: p });
    if (res.error) throw res.error;
    var d = res.data;
    if (!d || !(d.ok || d.success)) { err.textContent = (d && d.erro) || 'Usuário ou PIN incorretos.'; return; }
    G.token  = d.token;
    G.sessao = { usuario: d.usuario, nome: d.nome, perfil: d.perfil };
    localStorage.setItem(TKEY, G.token);
    localStorage.setItem(SKEY, JSON.stringify(G.sessao));
    el('handover-login-pin').value = '';
    abrirApp();
  } catch(e) { err.textContent = 'Erro de conexão.'; }
  finally { btn.disabled = false; btn.textContent = 'Entrar'; }
}

export async function doLogout() {
  if (G._autoRefreshTimer) { clearInterval(G._autoRefreshTimer); G._autoRefreshTimer = null; }
  try { if (G.token) await db.rpc('handover_logout', { p_token: G.token }); } catch(_) {}
  G.token = G.sessao = G.bundle = G.historico = null;
  localStorage.removeItem(TKEY); localStorage.removeItem(SKEY);
  el('app-shell').classList.add('hidden');
  el('app-shell').setAttribute('aria-hidden', 'true');
  el('handover-login-overlay').classList.remove('hidden');
}
