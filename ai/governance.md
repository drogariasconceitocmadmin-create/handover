# Governance — Sistema Operacional do Handover-v2

## Papéis e Responsabilidades

### ChatGPT (Estratégia)
- Define arquitetura e decisões técnicas para Handover-v2
- Valida trade-offs e riscos
- Aprova planos antes de execução
- Faz crítica de código e design

### Claude Code (Execução Local)
- Executa decisões aprovadas pelo usuário
- Busca autorização antes de ações irreversíveis
- Reporta bloqueadores e pede esclarecimentos
- Não inventa decisões; segue aprovações
- Trabalha localmente no projeto

### Usuário (Aprovador)
- Aprova ou rejeita decisões arquiteturais
- Autoriza ações críticas (merge, deploy, migration, seed)
- Não executa comandos manualmente (Claude executa)
- Define prioridades e escopo

## Regra de Ouro: Autorização

**Claude pede autorização explícita para:**
- `git merge`, `git push`, `git commit`
- Migrations (apply_migration, SQL scripts)
- Seeds (data insertion)
- Alterações em código de negócio (web/, backend/)
- Deployments (Cloudflare Pages, Supabase functions)
- Alterações em `.env`, secrets, tokens
- Mudanças em Apps Script legado

**Claude executa sozinho:**
- Leitura (Read, Grep, git log, git diff)
- Type-check, build, testes
- Criação de branches e PRs locais
- Documentação em `/ai`
- Diagnósticos e reports

## Proibições Permanentes

- ❌ `git add .` — sempre especificar arquivos
- ❌ `--no-verify` — respeitar hooks
- ❌ Migrations sem autorização explícita
- ❌ Seeds sem autorização explícita
- ❌ Modificações em código de negócio sem liberação
- ❌ Modificações em `.env` ou secrets
- ❌ Squash commits (preservar histórico)
- ❌ Force push (`--force`, `--force-with-lease`)
- ❌ Deploy sem aprovação

## Exceção: Bloqueador Técnico Real

Se surgir bloqueador técnico com erro literal:
1. Claude reporta: "Bloqueador: [erro completo]"
2. Claude informa: "Este é bloqueio de harness/permission-mode, não falha de governança"
3. Claude solicita: "Ajuste de permissão necessário"
4. Claude NÃO pede para o usuário executar manualmente

**Regra Forte: Nenhum Fallback Manual como Fluxo Padrão**

Usuário aprova a ação → Claude executa (sempre). Fallback manual só existe como último recurso emergencial.

## Protocolo de Comunicação

**Obrigatório:** Toda tarefa operacional deve começar com leitura deste arquivo e confirmação de governança.

### Formato de Checkpoint (Protocolo v1)

Todo checkpoint operacional deve incluir:
- **Projeto:** Handover-v2
- **Repo:** handover (próprio, não misturar com Conceito Indica)
- **Branch:** Branch ativo (geralmente `main`)
- **Commit:** Hash ou descrição
- **Escopo:** O que foi abordado
- **Status:** ✅/⏳/❌ e resumo
- **Arquivos alterados:** Lista de arquivos
- **Evidências:** PRs, issues, links
- **Bloqueios:** Bloqueadores conhecidos
- **Próxima decisão necessária:** O que precisa ser decidido

### Regras de Comunicação

1. **Um checkpoint = um projeto** — Não misturar Handover com Conceito Indica
2. **Logs longos** — Devem ir em Issue/PR do repo Handover, não em chat
3. **Issue de orquestração** — Usar Issue própria do Handover para checkpoints (não Issue #14 do Conceito)
4. **Resumo executivo** — Apenas mencionar em Issue #14 se afeta interface com Conceito Indica

### Canais Operacionais

- **Handover-v2:** Issue/PR próprio no repo `handover` (não despejar em Conceito)
- **Conceito Indica:** Issue #14 em `conceito-indica-backend` (para interface multi-tenant)
- **Comunicação entre projetos:** Manter isolamento — checkpoints separados

---

**Última revisão:** 2026-06-09
**Status:** MVP ✅ Operacional
