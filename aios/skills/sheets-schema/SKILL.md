# Skill: Schema das planilhas — Handover

Fonte de verdade no código: constante `HEADERS` e `SHEET_NAMES` em `Code.gs`. Esta skill resume o contrato operacional.

## Abas

| Aba | Nome na planilha |
|-----|------------------|
| Geral | `Geral` |
| Medicamentos | `Medicamentos` |
| Histórico | `Arquivo_Resolvidos` |
| Checklist | `Checklist_Turnos` |
| Compras (medicamentos) | `Compras_Medicamentos` |

## Geral

Colunas (ordem esperada pelo código):

`ID`, `Timestamp`, `Autor`, `Descricao`, `Resolvido`, `Ultima_Acao_Por`, `Ultima_Acao_Em`, `Resolvido_Por`, `Data_Resolucao`

## Medicamentos

`ID`, `Timestamp`, `Tipo`, `Medicamento`, `Pre_Pago`, `Cliente`, `Atendente`, `Previsao_Entrega`, `Comprado`, `Entregue`, `Telefone`, `Status`, `Status_Aviso_WhatsApp`, `Data_Aviso_WhatsApp`, `Preco_Venda`, `Ultima_Acao_Por`, `Ultima_Acao_Em`

## Compras_Medicamentos

Espelho operacional para equipe de compras (chave `ID_Handover` = `ID` da aba Medicamentos):

`ID_Handover`, `Data_Solicitacao`, `Tipo`, `Medicamento`, `Atendente`, `Cliente`, `Telefone`, `Previsao_Entrega`, `Preco_Venda`, `Pre_Pago`, `Status_Compra`, `Data_Compra`, `Comprado_Por`, `Observacao_Compra`, `Mensagem_Cliente`, `Status_Handover`, `Ultima_Atualizacao`

## Arquivo_Resolvidos

Registros arquivados (origem unificada):

`Origem`, `ID`, `Timestamp`, `Tipo`, `Autor`, `Descricao`, `Medicamento`, `Pre_Pago`, `Cliente`, `Atendente`, `Previsao_Entrega`, `Comprado`, `Resolvido`, `Entregue`, `Telefone`, `Status`, `Status_Aviso_WhatsApp`, `Data_Aviso_WhatsApp`, `Arquivado_Em`, `Preco_Venda`, `Ultima_Acao_Por`, `Ultima_Acao_Em`, `Resolvido_Por`, `Data_Resolucao`

## Checklist_Turnos

Cabeçalhos exatos:

`ID`, `Data`, `Turno`, `Horario_Referencia`, `Categoria`, `Item`, `Descricao`, `Status`, `Responsavel`, `Data_Hora_Check`, `Observacao`

### Regras operacionais

- **Preservar dados** existentes; não destruir linhas históricas sem processo explícito.
- **Novas colunas:** só com estratégia defensiva (`ensureHeaders_` / compatibilidade), **sem** `clear()`.
- **Anti-duplicidade:** combinação **Data + Turno + Item** (e identidade alinhada ao template) — o código evita duplicar linhas ao gerar o checklist do dia.

### Status de checklist (valores usados pelo sistema)

- Pendente  
- Feito  
- Não aplicável  
