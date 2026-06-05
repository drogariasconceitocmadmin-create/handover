/* ── normalização PT-BR ──
   Aplicada em TODOS os saves para garantir padrão de escrita,
   independente de o operador digitar em caixa alta, baixa ou mista.
   Módulo folha (sem imports). */

// Artigos e preposições que ficam em minúsculo no meio de nomes
var _PREP = /^(de|da|do|dos|das|e|a|o|em|com|por|para|sem|sob|até|ao|à|às|no|na|nos|nas|num|numa|uns|umas|ao|à)$/i;

// Nome próprio: cada palavra começa com maiúscula, preposições PT-BR em minúsculo
export function normNome(str) {
  if (!str) return str;
  return str.trim().replace(/\s+/g, ' ')
    .split(' ')
    .map(function(w, i) {
      if (!w) return w;
      if (i > 0 && _PREP.test(w)) return w.toLowerCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }).join(' ');
}

// Medicamento / item: Title Case com regras farmacêuticas
// - Tokens com dígitos (500mg, 400/57mg): deixa números, lowercase as unidades
// - Tokens com + ou / sem dígitos (Amox+Clav): Title Case em cada parte
// - Palavras normais: Title Case
export function normMed(str) {
  if (!str) return str;
  return str.trim().replace(/\s+/g, ' ')
    .split(' ')
    .map(function(w, i) {
      if (!w) return w;
      if (i > 0 && _PREP.test(w)) return w.toLowerCase();
      // Token com dígito: lowercase as letras (unidades: mg, ml, mcg, g, ui, etc.)
      if (/\d/.test(w)) return w.replace(/[A-Z]/g, function(c) { return c.toLowerCase(); });
      // Token com + ou / (ex: Amox+Clav): Title Case de cada segmento
      if (/[+\/]/.test(w)) {
        return w.toLowerCase().replace(/(^|[+\/])([a-z])/g, function(m, sep, c) { return sep + c.toUpperCase(); });
      }
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }).join(' ');
}

// Texto livre: primeira letra da string maiúscula, resto preservado
export function normTexto(str) {
  if (!str) return str;
  str = str.trim().replace(/\s+/g, ' ');
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Telefone: limpa máscara/ruído deixando só dígitos. Remove um 0 de prefixo
// interurbano se sobrar (ex: "011 98765-4321" → "11987654321"). NÃO prefixa 55 —
// o backend (_normalize_br_phone) cuida disso ao montar o link de WhatsApp.
export function normFone(str) {
  if (!str) return str;
  var d = String(str).replace(/\D/g, '');
  if (d.length > 11 && d.charAt(0) === '0') d = d.slice(1);
  return d;
}
