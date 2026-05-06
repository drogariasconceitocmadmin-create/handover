# Skill: Handover — aba Compras_Medicamentos

## Objetivo

Operação de compras em planilha **sem abrir o Web App**: a aba `Compras_Medicamentos` espelha pedidos da aba `Medicamentos` (chave `ID_Handover` = `ID` em Medicamentos). Alterações em `Status_Compra` disparam regras no backend (`onEdit`).

## Onde está no código

- Constantes: `SHEET_NAMES.COMPRAS_MEDICAMENTOS`, `HEADERS.Compras_Medicamentos`, `COMPRAS_STATUS_COMPRA`, `COMPRAS_MENSAGEM_CLIENTE_NAO_ENCONTRADO` em `Code.gs`.
- Espelhamento: `mirrorComprasMedicamentosRowForMedicamentoId_`, `sincronizarComprasMedicamentos_()` (manual no editor).
- Edição na planilha: `handleComprasMedicamentosStatusEdit_` chamado de `onEdit`.
- Status **Cancelado** no Handover: `syncMedicationStatus_`, `deriveMedicationStatus_`, `canShowWhatsAppButton_`; UI mínima em `Index.html` (badge + filtro).

## Regras operacionais

- **Nunca** `sheet.clear()`; colunas novas só no fim (padrão Handover).
- Atualização Handover ↔ Compras por **ID**, não por número de linha visual.
- `getRange(row, column, numRows, numColumns)` — 3º/4º argumentos são **quantidades**.
- Dropdown `Status_Compra`: Pendente de compra | Comprado | Não encontrado | Cancelado.
- **Não encontrado**: mantém `Medicamentos.Status` como Pendente; preenche sugestão em `Mensagem_Cliente` (sem envio automático de WhatsApp).

## Manual

1. Após deploy/migração, rodar no editor: `sincronizarComprasMedicamentos_()` para alinhar linhas existentes.
2. **Gatilho instalável (recomendado para edição na planilha):** executar `instalarTriggerComprasMedicamentos_()` uma vez (autorização do usuário). Listar: `listarTriggersHandover_()`; remover: `removerTriggerComprasMedicamentos_()`.
3. Entrada única para edições em `Compras_Medicamentos`: `handleComprasMedicamentosEdit_(e)` (chamada por `onEdit` e pelo trigger instalável). **Regra única** de `Status_Compra` → Medicamentos: `processarStatusCompraPorIdHandover_(id)` (lê o status na aba Compras). `handleComprasMedicamentosStatusEdit_` é wrapper legado que delega à mesma função.
4. **Pendente de compra** editado só na planilha: atualiza `Status_Handover` e `Ultima_Atualizacao` em Compras, **sem** alterar Medicamentos. Reversão explícita no Handover: `mirrorComprasMedicamentosRowForMedicamentoId_(id, { fromRevertToPending: true })`.

## Isolamento

- Projeto só **Handover** (`Handover/.clasp.json`); não misturar com POP nem com branch de auth/PIN salvo pedido explícito.
