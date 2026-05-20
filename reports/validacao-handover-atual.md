# Handover v86 (oficial)

Projeto: Handover - Drogarias Conceito

Branch: `hotfix/handover-p0-save-medicamentos`

Commit publicado: `cb99c24` - `ux(handover): permite formatacao simples em textos longos`

## Deployment oficial

Deployment: `AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw`

URL: `https://script.google.com/macros/s/AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw/exec`

Versao interna do deployment: `@93` - descricao: **Handover v86 formatacao simples textos longos**

Status: **APROVADA EM PRODUCAO** (validacao manual 2026-05-20)

Rollback: **NAO**

---

## Validacao manual v86

| Item | Resultado | Detalhe |
|------|-----------|---------|
| `**negrito**` renderiza como negrito | OK | Cards/textos longos |
| Lista com `* item` renderiza como lista | OK | Lista visual simples |
| Quebras de linha preservadas | OK | Texto longo formatado |
| Ver mais continua funcionando | OK | Cards expansíveis preservados |
| Ver menos continua funcionando | OK | Cards expansíveis preservados |
| Ver detalhes continua funcionando | OK | Modal preservado |
| HTML livre | BLOQUEADO | Escapado antes da formatacao permitida |
| POP | NAO tocado | - |
| Setup | NAO executado | - |
| Dados apagados | NAO | - |
| Falhas criticas | NENHUMA | - |

### Escopo da entrega v86

- Alteracao visual-only em `Index.html`.
- Formatação simples segura para textos longos dos cards e detalhes.
- Suporte a `**texto**` como negrito.
- Suporte a linhas iniciadas por `* ` ou `- ` como lista visual simples.
- Quebras de linha preservadas.
- HTML livre escapado/bloqueado antes da formatação permitida.
- Botoes `Ver mais` / `Ver menos` preservados.
- Modal `Ver detalhes` preservado.
- Sem alteração de backend, planilhas, setup, dados ou POP.

---

## Referencias recentes

| Versao | Status |
|--------|--------|
| v84 | APROVADA (2026-05-19) - Historico inclui Compras/reposicao, Categoria interna (@90, commit `dcdad30`) |
| v85 | APROVADA - Expansao de textos longos nos cards (@92, commit `3f21d36`) |
| **v86** | **ATIVA OFICIAL** (2026-05-20) - Formatacao simples segura em textos longos (@93, commit `cb99c24`) |

---

## Proximo passo

Operacao normal. Sistema em producao com textos longos formatados de forma segura nos cards e detalhes.
