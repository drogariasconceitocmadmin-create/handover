# 🧪 SMOKE TEST PLAN — Handover v2

**Data:** 2026-06-05  
**Status:** Em progresso  
**Scope:** Todos os botões, formulários, filtros e interações

---

## 1. AUTENTICAÇÃO

- [ ] Login com `isaque` / PIN `1254` 
- [ ] Login com outro usuário (marco/1234)
- [ ] Auto-login via localStorage
- [ ] Logout funciona

---

## 2. DASHBOARD (6 KPIs)

- [ ] Dashboard carrega com 6 KPIs visíveis
- [ ] ENCOMENDAS: contagem correta
- [ ] PENDÊNCIAS: contagem correta
- [ ] COMPRADOS: contagem correta
- [ ] COMPRADOS SEM AVISO: contagem correta
- [ ] COMPRAS ATIVAS: contagem correta
- [ ] Clicar em KPI filtra a aba correspondente

---

## 3. TOPBAR & NAVEGAÇÃO

- [ ] Título "Handover" visível
- [ ] Operador pill mostra nome correto
- [ ] Turno selector (Manhã/Noite) funciona
- [ ] Turno change recarrega bundle imediatamente
- [ ] Theme toggle (light/dark) funciona
- [ ] Sidebar collapsa/expande
- [ ] Todas as abas clicáveis

---

## 4. ABA PENDÊNCIAS

### Listagem
- [ ] Lista carrega pendências corretamente
- [ ] Search filtra por título, descrição, autor
- [ ] Filtros funcionam (Todas, Urgentes, Normais)
- [ ] Cada item mostra: título, descrição, urgência, autor, data

### Ações por item
- [ ] Kebab menu abre/fecha
- [ ] "Ver detalhes" abre modal
- [ ] "Resolver" remove item e aparece em histórico
- [ ] "Cancelar" remove item e aparece em histórico
- [ ] Modal detail fecha com X ou clique fora
- [ ] N/A button funciona (se aplicável)

### Novo Registro
- [ ] Botão "Novo Registro" abre modal
- [ ] Form tem 3 tipos: Pendência, Encomenda, Compra
- [ ] Campo "Título" é obrigatório
- [ ] Campo "Prazo" tem botões Amanhã, Depois, Semana
- [ ] **Botões de data funcionam corretamente**
- [ ] Salvar registra pendência
- [ ] Modal fecha após salvar

---

## 5. ABA ENCOMENDAS

### Listagem
- [ ] Lista carrega medicamentos corretamente
- [ ] Search filtra por medicamento, cliente, telefone
- [ ] Filtros funcionam
- [ ] Cada item mostra: medicamento, cliente, status, fornecedor

### Ações por item
- [ ] Kebab menu funciona
- [ ] "Comprar" marca como comprado
- [ ] "Entregar" marca como entregue
- [ ] "WhatsApp" gera link e copia
- [ ] "Cancelar" com motivo funciona
- [ ] Modal detail abre/fecha

### Novo Registro - Encomenda
- [ ] Form pré-seleciona "Encomenda"
- [ ] Campo "Medicamento" é obrigatório
- [ ] Campo "Previsão de entrega" tem botões de data
- [ ] **Botões de atalho de data funcionam**
- [ ] Checkbox "Pré-pago" funciona
- [ ] Salvar registra encomenda

---

## 6. ABA COMPRAS

### Listagem
- [ ] Lista carrega compras corretamente
- [ ] Search filtra por item, fornecedor
- [ ] Filtros funcionam
- [ ] Cada item mostra: item, quantidade, prioridade, status

### Ações por item
- [ ] Kebab menu funciona
- [ ] Ações disponíveis são executadas
- [ ] Modal detail abre/fecha

### Novo Registro - Compra
- [ ] Form pré-seleciona "Compra e reposição"
- [ ] Campo "Item" é obrigatório
- [ ] Campo "Quantidade" funciona
- [ ] Campo "Prioridade" tem opções
- [ ] Salvar registra compra

---

## 7. ABA CHECKLIST

### Listagem
- [ ] Checklist carrega corretamente
- [ ] Turno auto-detecto (Manhã/Noite) correto
- [ ] ~10 itens de checklist visíveis
- [ ] Cada item tem checkbox, descrição com quebras de linha, N/A button

### Interações
- [ ] Checkbox toggle funciona
- [ ] N/A button funciona (posicionado correto no canto inferior)
- [ ] N/A button fica highlighted quando ativo
- [ ] Descrições com `\n` renderizam corretamente (quebras de linha)
- [ ] Search filtra itens de checklist
- [ ] Filtros funcionam

---

## 8. ABA HISTÓRICO

### Listagem
- [ ] Histórico carrega com 100+ items
- [ ] Search funciona
- [ ] Filtros funcionam
- [ ] Cada item mostra: título, quem, quando, ação

### "Ver trilha"
- [ ] Botão "Ver trilha" abre modal
- [ ] Modal mostra: Título, Status, Descrição, Quem, Quando
- [ ] Modal fecha com X ou clique fora

### Reverter
- [ ] Itens revertíveis têm botão reverter
- [ ] Clicar reverter desfaz a ação
- [ ] Item volta para aba original

---

## 9. ABA COMPRADOR

### Listagem
- [ ] Comprador carrega com itens pendentes
- [ ] Search filtra
- [ ] Filtros funcionam

### Ações
- [ ] "Comprado" marca item como comprado
- [ ] "Cancelado" marca como cancelado
- [ ] "Não encontrado" marca como não encontrado
- [ ] Item remove da lista após ação

---

## 10. FORMS & VALIDAÇÕES

### Novo Registro Modal
- [ ] Modal abre com 3 opções de tipo
- [ ] Cada tipo tem campos corretos
- [ ] Campos obrigatórios validam
- [ ] Botão Salvar desabilitado se inválido
- [ ] Cancelar fecha sem salvar
- [ ] Salvar recarrega dados

### Date Input Buttons
- [ ] "Amanhã" botão calcula +1 dia corretamente
- [ ] "Depois de amanhã" botão calcula +2 dias
- [ ] "Semana que vem" botão calcula +7 dias
- [ ] Data fica visível no input após clicar
- [ ] Input ainda permite digitação manual
- [ ] Calendar picker ainda funciona

---

## 11. BUSCA & FILTROS

### Search
- [ ] Search busca por campo correto (item-dependente)
- [ ] Search é case-insensitive
- [ ] Resultados atualizam em tempo real
- [ ] Limpar search mostra todos novamente

### Filtros
- [ ] Cada aba tem seus filtros
- [ ] Filtro click atualiza seleção visual
- [ ] Dados recarregam ao filtrar
- [ ] Badge com count aparece no filtro ativo

---

## 12. THEME & UI

- [ ] Light mode: fundo claro, texto escuro
- [ ] Dark mode: fundo escuro, texto claro
- [ ] Botões têm hover states
- [ ] Botões de data têm hover states
- [ ] Modal backdrop é semi-transparente
- [ ] Scrollbars funcionam
- [ ] Layout responsivo (teste em mobile se possível)

---

## 13. ANOMALIAS A VERIFICAR

- [ ] Nenhuma mensagem de erro no console
- [ ] Nenhuma ação bloqueada indevidamente
- [ ] Todas as ações de cancelamento funcionam de qualquer aba
- [ ] Nenhuma data field sem botões de atalho
- [ ] Nenhum modal preso/não-fechável
- [ ] Nenhum filtro/search quebrado
- [ ] Nenhum turno change não-reativo
- [ ] Performance: páginas carregam em < 2s

---

## Resultado Final

**Total de checks:** 80+  
**Passed:** ___ / ___  
**Failed:** ___ / ___  
**Blocker Issues:** ___  
**Minor Issues:** ___  

**Status:** ⏳ Pendente
