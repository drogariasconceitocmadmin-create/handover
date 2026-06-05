/* Handover v2 — cliente Supabase + tratamento de erro de RPC.
   NÃO importa módulos de domínio: deslogar usa callback injetado (rule 4). */
import { toast } from './utils.js';

var cfg = window.HANDOVER_CONFIG;
export var db = window.supabase.createClient(cfg.url, cfg.anonKey);

var onSessionExpired = null;
export function setOnSessionExpired(fn) { onSessionExpired = fn; }

function sessaoExpirada() { toast('Sessão expirada.', 'erro'); if (onSessionExpired) onSessionExpired(); }

export function rpcError(res) {
  if (!res.error) return false;
  if (String(res.error.message || '').indexOf('sessao_invalida') >= 0) { sessaoExpirada(); return true; }
  return false;
}
