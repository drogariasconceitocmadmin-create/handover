# Checklist templates (verbatim do legado) — seed de `checklist_templates`

Dois turnos: **Manhã** (23 itens) e **Noite** (10 itens). Para cada item: `turno`, `ordem` (índice 0-based), `item_id`, `horario_referencia`, `categoria`, `item`, `descricao` (multilinha, manter `\n` exatos). O agente do 0007 deve inserir cada um com `insert ... on conflict (turno, item_id) do nothing`.

---

## TURNO: Manhã (horario_referencia = "07:00" salvo indicado)

### 0 — manha_climatizacao · Estrutura e Ambiente · "Climatização"
```
• Ligar o ar-condicionado.
• Ligar a cortina de ar.
• Colocar a moto em local especificado no exterior da loja.
• Verificar se o ambiente está confortável para clientes e equipe.

Critério de conclusão: salão climatizado e entrada com cortina de ar ligada.
```

### 1 — manha_iluminacao · Estrutura e Ambiente · "Iluminação"
```
• Acender luzes do salão.
• Acender luzes da fachada.
• Acender tótens e pontos visuais externos, se houver.

Critério de conclusão: loja visível, iluminada e com aparência de operação ativa.
```

### 2 — manha_som_ambiente · Estrutura e Ambiente · "Som ambiente"
```
• Ligar a rádio interna.
• Ajustar volume para nível agradável.

Critério de conclusão: som funcionando sem atrapalhar atendimento, telefone ou comunicação da equipe.
```

### 3 — manha_fachada · Estrutura e Ambiente · "Fachada"
```
• Verificar limpeza da calçada.
• Colocar bandeiras da loja no exterior.
• Verificar se há lixo, caixas, objetos ou obstruções na entrada.
• Corrigir ou acionar responsável quando houver problema.

Critério de conclusão: entrada limpa, livre e convidativa para o cliente.
```

### 4 — manha_servidor · Sistemas e Operação · "Servidor"
```
• Ligar o servidor.
• Verificar se o banco de dados carregou corretamente.
• Confirmar se o sistema principal está acessível.

Critério de conclusão: sistema operacional pronto para venda.
```

### 5 — manha_pdvs_balcao · Sistemas e Operação · "PDVs e Balcão"
```
• Ligar computadores.
• Ligar monitores.
• Ligar impressoras térmicas.
• Conferir se os equipamentos respondem corretamente.

Critério de conclusão: pontos de atendimento e caixa prontos para operar.
```

### 6 — manha_troco · Sistemas e Operação · "Troco"
```
• Conferir o kit de troco.
• Verificar se há moedas e notas suficientes para iniciar o turno.

Critério de conclusão: troco disponível para as primeiras vendas do dia.
```

### 7 — manha_caixa · Sistemas e Operação · "Caixa"
```
• Abrir o caixa.
• Conferir valores iniciais.
• Registrar qualquer divergência antes de iniciar vendas.

Critério de conclusão: caixa aberto, conferido e pronto para operação.
```

### 8 — manha_handover · Sistemas e Operação · "Handover"
```
• Checar mensagens do turno anterior.
• Limpar do painel o que já foi resolvido.
• Programar entregas do dia de medicamentos encomendados.
• Verificar pendências críticas antes do início do fluxo de clientes.

Critério de conclusão: pendências conhecidas, resolvidos limpos e entregas organizadas.
```

### 9 — manha_internet_tef · Sistemas e Operação · "Internet e TEF"
```
• Testar conexão de internet.
• Verificar máquinas de cartão.
• Conferir se as maquinetas estão carregadas.
• Realizar teste simples quando houver dúvida de conexão.

Critério de conclusão: loja pronta para receber pagamentos por cartão e operar sistemas online.
```

### 10 — manha_telefones_whatsapp · Sistemas e Operação · "Telefones e WhatsApp"
```
• Verificar bateria do celular da loja.
• Confirmar conexão de internet no aparelho.
• Conferir mensagens recebidas enquanto a loja estava fechada.
• Priorizar mensagens ligadas a medicamentos, entregas e clientes aguardando resposta.

Critério de conclusão: WhatsApp ativo e mensagens críticas identificadas.
```

### 11 — manha_pisos_prateleiras · Higiene e Organização · "Pisos e Prateleiras"
```
• Conferir se a limpeza geral foi feita.
• Verificar se há pó, manchas ou sujeira visível.
• Acionar correção imediata quando necessário.

Critério de conclusão: salão limpo e prateleiras apresentáveis.
```

### 12 — manha_lixeiras · Higiene e Organização · "Lixeiras"
```
• Verificar se todas as lixeiras estão com sacos novos.
• Conferir se há lixo acumulado do turno anterior.

Critério de conclusão: lixeiras preparadas para o turno.
```

### 13 — manha_banheiros_pias · Higiene e Organização · "Banheiros e Pias"
```
• Repor sabonete líquido.
• Repor papel toalha.
• Conferir pontos de uso da equipe e clientes, quando aplicável.

Critério de conclusão: banheiros e pias abastecidos e utilizáveis.
```

### 14 — manha_alcool_gel · Higiene e Organização · "Álcool em gel"
```
• Verificar disponibilidade de álcool em gel no balcão.
• Repor quando estiver baixo ou vazio.

Critério de conclusão: álcool em gel disponível para clientes e equipe.
```

### 15 — manha_moto · Logística de Entrega · "Moto"
```
• Conferir condições da moto junto com o entregador.
• Usar o sistema/checklist próprio, quando disponível.
• Registrar qualquer impedimento operacional.

Critério de conclusão: moto liberada para entregas ou pendência registrada.
```

### 16 — manha_bau_mochila · Logística de Entrega · "Baú/Mochila"
```
• Verificar limpeza interna.
• Confirmar se está seco.
• Corrigir antes de transportar medicamentos ou produtos.

Critério de conclusão: compartimento de entrega limpo e adequado.
```

### 17 — manha_maquineta_movel · Logística de Entrega · "Maquineta móvel"
```
• Conferir bateria da máquina de cartão de rua.
• Confirmar se está operante para entregas.

Critério de conclusão: maquineta móvel pronta para uso externo.
```

### 18 — manha_termolabeis · Balcão e Medicamentos · "Termolábeis"
```
• Conferir temperatura da geladeira de vacinas/insulinas.
• Anotar a temperatura conforme rotina da loja.
• Registrar desvio imediatamente se estiver fora do padrão esperado.

Critério de conclusão: temperatura conferida e registrada.
```

### 19 — manha_psicotropicos · Balcão e Medicamentos · "Psicotrópicos"
```
• Verificar se o armário controlado está fechado.
• Confirmar que a chave está em local seguro e acessível para a pessoa autorizada.

Critério de conclusão: controlados protegidos e acesso sob controle.
```

### 20 — manha_reposicao · Balcão e Medicamentos · "Reposição"
```
• Verificar buracos nas prateleiras.
• Priorizar reposição imediata dos itens de maior giro.
• Acionar estoque quando houver falta aparente.

Critério de conclusão: principais produtos de giro expostos e sem ruptura visual crítica.
```

### 21 — manha_trava_saida · Caixa e Financeiro · "TRAVA DE SAÍDA"
```
1. Conferir caixa físico vs. sistema.
2. Executar fechamento do PDV (quando aplicável).
3. Conciliar TEF (cartão) com o sistema.
4. Conferir PIX/links (valores e comprovantes).
5. Registrar estornos/cancelamentos com motivo.
6. Guardar valores e trancar o cofre.

Critério de aprovação: saldo bate ou divergência registrada (valor + possível causa + ação).
```

### 22 — manha_fechamento_abertura · Fechamento da abertura · "Conferência final no Handover"
```
Antes de liberar a loja como pronta para operação, o responsável deve conferir no Handover:
• total de itens do checklist;
• itens feitos;
• itens pendentes;
• percentual concluído;
• observações registradas;
• pendências críticas que precisam ser comunicadas à gerência.
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
