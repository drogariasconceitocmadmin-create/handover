# Checklist templates (verbatim do legado) — seed de `checklist_templates`

Dois turnos: **Manhã** (10 itens) e **Noite** (10 itens). Para cada item: `turno`, `ordem` (índice 0-based), `item_id`, `horario_referencia`, `categoria`, `item`, `descricao` (multilinha, manter `\n` exatos). O agente do 0007 deve inserir cada um com `insert ... on conflict (turno, item_id) do nothing`.

> **Atualizado 2026-06-05:** Template Manhã substituído — os 23 itens de abertura foram removidos e substituídos pelos 10 itens de encerramento/handover (agora usados em ambos os turnos).

---

## TURNO: Manhã (horario_referencia = "07:00")

### 0 — manha_medicamentos_risco_cliente · Medicamentos · "RISCO DIRETO NO CLIENTE"
```
1. Atualizar encomendas (chegou / não chegou / cliente avisado).
2. Registrar clientes que precisam de retorno.
3. Revisar previsões (hoje/atrasado → ação definida).
4. Conferir e trancar controlados (psicotrópicos).
5. Conferir e registrar temperatura de termolábeis.

Critério de aprovação: nenhum cliente aguardando medicamento sem ação definida.
```

### 1 — manha_entregas_trava_operacional · Entregas · "TRAVA OPERACIONAL"
```
1. Finalizar entregas do dia ou justificar.
2. Registrar pendentes com cliente + motivo + próxima ação.
3. Conferir moto (condição de uso) ou registrar problema em sistema próprio.
4. Guardar moto.

Critério de aprovação: nenhuma entrega sem status e próximo passo.
```

### 2 — manha_fechamento_moto · Entregas · "Fechamento da Moto"
```
Preencher sistema da moto com entregador e guardar chaves em local pré estipulado.
Guardar moto no interior da loja.
```

### 3 — manha_clientes_whatsapp_experiencia · Clientes e WhatsApp · "EXPERIÊNCIA"
```
1. Responder conversas críticas (preço, disponibilidade, entrega).
2. Atualizar conversas importantes.
3. Registrar no Handover clientes que exigem retorno.

Critério de aprovação: 0 clientes críticos sem resposta/registro.
```

### 4 — manha_loja_higiene_pronto_abrir · Loja e Higiene · "PRONTO PRA ABRIR"
```
1. Limpar e organizar balcão.
2. Esvaziar lixeiras e repor sacos.
3. Garantir loja sem sujeira visível.
4. Limpar e abastecer WC (papel/sabão).
5. Organizar sala de vacinas.
6. Retirar bandeiras da fachada e guardar em local adequado.

Critério de aprovação: ambiente pronto para abertura imediata.
```

### 5 — manha_equipamentos_nao_travar_amanha · Equipamentos · "NÃO TRAVAR AMANHÃ"
```
1. Encerrar PDVs/computadores corretamente.
2. Desligar o servidor conforme procedimento da loja (quando aplicável).
3. Colocar todas as maquinetas em carga.
4. Colocar celular da loja em carga.
5. Verificar internet/roteador (ou registrar problema).

Critério de aprovação: nenhum equipamento crítico indisponível sem registro.
```

### 6 — manha_seguranca_risco_zero · Segurança · "RISCO ZERO"
```
1. Trancar cofre e armários sensíveis (incluindo controlados).
2. Fechar portas, grades e vitrines.
3. Ativar alarme.
4. Conferir área externa (fachada) sem itens expostos indevidamente.

Critério de aprovação: loja segura após saída da equipe.
```

### 7 — manha_caixa_financeiro_trava_saida · Caixa e Financeiro · "TRAVA DE SAÍDA"
```
1. Conferir caixa físico vs. sistema.
2. Executar fechamento do PDV (quando aplicável).
3. Conciliar TEF (cartão) com o sistema.
4. Conferir PIX/links (valores e comprovantes).
5. Registrar estornos/cancelamentos com motivo.
6. Guardar valores e trancar o cofre.

Critério de aprovação: saldo bate ou divergência registrada (valor + possível causa + ação).
```

### 8 — manha_handover_passar_jogo_limpo · Handover · "PASSAR O JOGO LIMPO"
```
1. Registrar todas as pendências reais.
2. Marcar como resolvido apenas o que está concluído.
3. Para cada pendência, registrar: o que é + impacto + próxima ação + prazo.

Critério de aprovação: qualquer pessoa consegue assumir sabendo o que fazer agora.
```

### 9 — manha_validacao_final · Validação final · "Validação final (30–60s)"
```
Responder sem hesitar:
• O que o próximo turno faz primeiro?
• Há cliente aguardando retorno?
• Há entrega pendente?
• Existe algum risco não registrado?

Se houver dúvida → voltar e registrar no Handover.
```

---

## TURNO: Noite

### 0 — noite_medicamentos_risco_cliente · 21:30 · Medicamentos · "RISCO DIRETO NO CLIENTE"
```
1. Atualizar encomendas (chegou / não chegou / cliente avisado).
2. Registrar clientes que precisam de retorno.
3. Revisar previsões (hoje/atrasado → ação definida).
4. Conferir e trancar controlados (psicotrópicos).
5. Conferir e registrar temperatura de termolábeis.

Critério de aprovação: nenhum cliente aguardando medicamento sem ação definida.
```

### 1 — noite_entregas_trava_operacional · 21:30 · Entregas · "TRAVA OPERACIONAL"
```
1. Finalizar entregas do dia ou justificar.
2. Registrar pendentes com cliente + motivo + próxima ação.
3. Conferir moto (condição de uso) ou registrar problema em sistema próprio.
4. Guardar moto.

Critério de aprovação: nenhuma entrega sem status e próximo passo.
```

### 2 — noite_fechamento_moto · 22:00 · Entregas · "Fechamento da Moto"
```
Preencher sistema da moto com entregador e guardar chaves em local pré estipulado.
Guardar moto no interior da loja.
```

### 3 — noite_clientes_whatsapp_experiencia · 21:30 · Clientes e WhatsApp · "EXPERIÊNCIA"
```
1. Responder conversas críticas (preço, disponibilidade, entrega).
2. Atualizar conversas importantes.
3. Registrar no Handover clientes que exigem retorno.

Critério de aprovação: 0 clientes críticos sem resposta/registro.
```

### 4 — noite_loja_higiene_pronto_abrir · 22:00 · Loja e Higiene · "PRONTO PRA ABRIR"
```
1. Limpar e organizar balcão.
2. Esvaziar lixeiras e repor sacos.
3. Garantir loja sem sujeira visível.
4. Limpar e abastecer WC (papel/sabão).
5. Organizar sala de vacinas.
6. Retirar bandeiras da fachada e guardar em local adequado.

Critério de aprovação: ambiente pronto para abertura imediata.
```

### 5 — noite_equipamentos_nao_travar_amanha · 22:00 · Equipamentos · "NÃO TRAVAR AMANHÃ"
```
1. Encerrar PDVs/computadores corretamente.
2. Desligar o servidor conforme procedimento da loja (quando aplicável).
3. Colocar todas as maquinetas em carga.
4. Colocar celular da loja em carga.
5. Verificar internet/roteador (ou registrar problema).

Critério de aprovação: nenhum equipamento crítico indisponível sem registro.
```

### 6 — noite_seguranca_risco_zero · 22:15 · Segurança · "RISCO ZERO"
```
1. Trancar cofre e armários sensíveis (incluindo controlados).
2. Fechar portas, grades e vitrines.
3. Ativar alarme.
4. Conferir área externa (fachada) sem itens expostos indevidamente.

Critério de aprovação: loja segura após saída da equipe.
```

### 7 — noite_caixa_financeiro_trava_saida · 22:15 · Caixa e Financeiro · "TRAVA DE SAÍDA"
```
1. Conferir caixa físico vs. sistema.
2. Executar fechamento do PDV (quando aplicável).
3. Conciliar TEF (cartão) com o sistema.
4. Conferir PIX/links (valores e comprovantes).
5. Registrar estornos/cancelamentos com motivo.
6. Guardar valores e trancar o cofre.

Critério de aprovação: saldo bate ou divergência registrada (valor + possível causa + ação).
```

### 8 — noite_handover_passar_jogo_limpo · 22:00 · Handover · "PASSAR O JOGO LIMPO"
```
1. Registrar todas as pendências reais.
2. Marcar como resolvido apenas o que está concluído.
3. Para cada pendência, registrar: o que é + impacto + próxima ação + prazo.

Critério de aprovação: qualquer pessoa consegue assumir sabendo o que fazer agora.
```

### 9 — noite_validacao_final · 22:15 · Validação final · "Validação final (30–60s)"
```
Responder sem hesitar:
• O que o próximo turno faz primeiro?
• Há cliente aguardando retorno?
• Há entrega pendente?
• Existe algum risco não registrado?

Se houver dúvida → voltar e registrar no Handover.
```
