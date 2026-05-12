# Runbook — Virada de Produção: Compras Separada + Reset Handover

**Branch:** `hotfix/handover-p0-save-medicamentos`  
**Commit Code.gs:** `c79a025`  
**Deployment staging v68:** `AKfycbwrk9JXS2-6XsIFan8ky7YCtBvGm3mhcfUptaKXe6iBm5XLO-tOQx2d8QTuN15aIcSo`  
**URL staging:** `https://script.google.com/macros/s/AKfycbwrk9JXS2-6XsIFan8ky7YCtBvGm3mhcfUptaKXe6iBm5XLO-tOQx2d8QTuN15aIcSo/exec`

---

## Pré-requisitos

- Estar logado na conta Google que tem acesso à planilha do Handover.
- Abrir o editor GAS: [script.google.com](https://script.google.com) → projeto Handover.
- Para cada função abaixo: selecionar o nome no dropdown de funções → clicar ▶ Executar → verificar log.

---

## FASE 1 — Backup do Handover

**Função:** `backupHandoverPlanilha`

**O que faz:** Copia a planilha atual do Handover como `BACKUP_YYYYMMDD_HHMM_Handover Drogarias Conceito`. Não toca em dados nem propriedades.

**Como executar:**
1. No editor GAS, selecionar `backupHandoverPlanilha` no dropdown
2. Clicar ▶ Executar
3. No log (View → Logs): anotar o `id` e `url` do backup criado

**Resultado esperado no log:**
```
backupHandoverPlanilha: backup criado id=<ID> nome=BACKUP_... url=https://docs.google.com/...
```

**Critério de avanço:** Log exibe `ok: true` com ID válido. Abrir a URL do backup e confirmar dados presentes.

---

## FASE 2 — Criar planilha Compras_Drogarias_Conceito

**Função:** `setupComprasPlanilha`

**O que faz:**
1. Cria nova planilha `Compras_Drogarias_Conceito` no Google Drive da conta.
2. Cria aba `Compras_Medicamentos` com os 24 headers corretos e layout formatado.
3. Salva o ID automaticamente na propriedade de script `COMPRAS_SPREADSHEET_ID`.

**Como executar:**
1. Selecionar `setupComprasPlanilha` → ▶ Executar
2. No log: anotar o `id` e `url` da nova planilha

**Resultado esperado no log:**
```
setupComprasPlanilha: OK id=<ID> url=https://docs.google.com/spreadsheets/d/<ID>/edit
```

**Critério de avanço:** Abrir a URL e confirmar aba `Compras_Medicamentos` com cabeçalho azul e 24 colunas.

---

## FASE 3 — Verificar propriedade COMPRAS_SPREADSHEET_ID

**Como verificar:**
1. No editor GAS: Project Settings (⚙) → Script Properties
2. Confirmar que `COMPRAS_SPREADSHEET_ID` está preenchido com o ID da planilha criada na FASE 2

**Alternativa:** executar no console GAS:
```javascript
Logger.log(PropertiesService.getScriptProperties().getProperty('COMPRAS_SPREADSHEET_ID'));
```

---

## FASE 4 — Sincronizar dados legados para nova planilha

**Função:** `sincronizarComprasMedicamentos_` *(ou criar wrapper público se necessário)*

**O que faz:** Lê cada linha de `Medicamentos` no Handover e espelha/atualiza `Compras_Medicamentos` na nova planilha. Idempotente — não duplica registros por `ID_Handover`.

**Como executar:**
1. Selecionar `sincronizarComprasMedicamentos_` → ▶ Executar *(ou criar wrapper `sincronizarComprasMedicamentos` sem underscore se não aparecer no dropdown)*
2. Log deve exibir: `sincronizados=N` onde N = número de registros em Medicamentos

**Critério de avanço:** Abrir a planilha `Compras_Drogarias_Conceito` → aba `Compras_Medicamentos` e confirmar que as encomendas/faltas aparecem com `ID_Handover` preenchido.

---

## FASE 5 — Renomear e ocultar aba legada no Handover

**Função:** `renomearAbaComprasLegacy`

**O que faz:** Renomeia a aba `Compras_Medicamentos` no Handover para `LEGACY_Compras_YYYYMMDD` e a oculta. Não apaga nenhum dado.

**Pré-condição:** FASE 4 concluída e dados confirmados na nova planilha.

**Como executar:**
1. Selecionar `renomearAbaComprasLegacy` → ▶ Executar
2. Log: `renomeada para LEGACY_Compras_YYYYMMDD e ocultada no Handover`

**Critério de avanço:** No Handover, a aba `Compras_Medicamentos` não aparece mais na barra de abas (oculta). Aba `LEGACY_Compras_...` pode ser reexibida manualmente se necessário.

---

## FASE 5.1 — Instalar trigger na nova planilha de Compras

**Função:** `instalarTriggerComprasMedicamentos`

**O que faz:** Remove triggers duplicados do handler `handleComprasMedicamentosEdit_` e instala um novo trigger `onEdit` apontando para a planilha `Compras_Drogarias_Conceito`.

**Como executar:**
1. Selecionar `instalarTriggerComprasMedicamentos` → ▶ Executar
2. Log: `instalarTriggerComprasMedicamentos_: OK spreadsheetId=<ID_COMPRAS> nome=Compras_Drogarias_Conceito`

**Verificar:** Selecionar `listarTriggersHandover` → ▶ Executar → log deve exibir o trigger com `sourceId = <ID_COMPRAS>`.

---

## FASE 6 — Zerar dados de teste do Handover

**Função:** `zerarHandoverParaProducao`

**⚠️ AÇÃO IRREVERSÍVEL nos dados atuais — confirmar FASE 1 (backup) antes de executar.**

**O que faz:** Limpa o conteúdo de dados (linhas 2+) das abas:
- `Geral`
- `Medicamentos`
- `Arquivo_Resolvidos`
- `Checklist_Turnos`
- `Auditoria_Handover`

**Não apaga:** cabeçalhos, formatação, validações, usuários (`Usuarios_Handover`), aba legada de Compras.

**Como executar:**
1. Confirmar que backup da FASE 1 está acessível e tem dados
2. Selecionar `zerarHandoverParaProducao` → ▶ Executar
3. Log: `{ Geral: "limpa_N_linhas", Medicamentos: "limpa_N_linhas", ... }`

**Critério de avanço:** Abrir a planilha do Handover → cada aba listada deve ter apenas a linha de cabeçalho.

---

## FASE 7 — Smoke test na URL staging

**URL staging v68:**  
`https://script.google.com/macros/s/AKfycbwrk9JXS2-6XsIFan8ky7YCtBvGm3mhcfUptaKXe6iBm5XLO-tOQx2d8QTuN15aIcSo/exec`

**Checklist mínimo:**
- [ ] Login/PIN funciona
- [ ] Dashboard abre sem erros
- [ ] Criar nova Pendência → Salvar → card aparece
- [ ] Criar nova Encomenda sem preço → Salvar → card aparece
- [ ] Criar nova Encomenda com data → Salvar → espelha em `Compras_Medicamentos` da nova planilha
- [ ] Atualizar agora → sem erros no console
- [ ] Checklist Manhã → carrega instantâneo
- [ ] Compras_Medicamentos na nova planilha recebeu a encomenda de teste

---

## FASE 8 — Publicar como deployment oficial

Após smoke aprovado na staging:

```bash
cd "C:\Users\Marco\Desktop\Sis Drogaria\Handover"
npx @google/clasp deploy --deploymentId AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw --description "Handover v68 Compras planilha separada"
```

**URL oficial (permanente):**  
`https://script.google.com/macros/s/AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw/exec`

---

## Rollback de emergência

Se algo der errado antes da FASE 6 (dados intactos no Handover):
1. Reverter propriedade `COMPRAS_SPREADSHEET_ID` para vazio no editor GAS
2. Reexibir aba `LEGACY_Compras_...` manualmente e renomear de volta para `Compras_Medicamentos`
3. Fazer `clasp deploy` com commit anterior (`b70861f`) no deployment oficial

Se já executou FASE 6 (zerar Handover):
1. Abrir backup criado na FASE 1
2. Copiar manualmente os dados das abas para a planilha do Handover ativa

---

## Mapeamento de funções manuais

| Fase | Função GAS | Planilha alvo |
|------|-----------|---------------|
| 1 | `backupHandoverPlanilha` | Google Drive (cópia) |
| 2 | `setupComprasPlanilha` | Drive (cria Compras_Drogarias_Conceito) |
| 3 | Verificar Script Properties | — |
| 4 | `sincronizarComprasMedicamentos_` | Compras_Drogarias_Conceito |
| 5 | `renomearAbaComprasLegacy` | Handover (aba legada) |
| 5.1 | `instalarTriggerComprasMedicamentos` | Trigger → Compras |
| 6 | `zerarHandoverParaProducao` | Handover (abas operacionais) |
