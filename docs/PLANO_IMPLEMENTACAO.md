# Plano de implementação — Ask.IA 100% funcional

> Gerado em 01/11/2026, a partir da análise da branch `novo-visual` / `integracao-ia`.
> Este documento é vivo: conforme cada item é feito, o commit correspondente deve
> ser referenciado aqui (ou o item riscado).

## 1. Lista consolidada de erros, pontos de atenção e melhorias

### 1.1 Erros / falhas de verdade

| # | Onde | O quê | Status |
|---|---|---|---|
| E1 | `ConversaController.registrar()` | Endpoint `POST /api/conversas/interacoes` aceita a "resposta da IA" vinda **do cliente** — qualquer um com Postman grava uma resposta falsa no histórico de um usuário. Transitório por design, documentado no próprio código. | Corrigido na Fase 2 |
| E2 | `GlobalExceptionHandler` | Não tem `@ExceptionHandler(Exception.class)`: um erro inesperado (NPE, etc.) vira 500 cru, fora do formato `{"message": "..."}` que o frontend espera (`err.error?.message`). | Corrigido na Fase 4 |
| E3 | `SecurityConfig` (CORS) | Origem liberada fixa em `http://localhost:4200` — quebra em qualquer deploy fora do localhost. | Corrigido na Fase 4 |
| E4 | `environment.ts` (produção) | `apiUrl` aponta para `http://localhost:8080` mesmo em build de produção (TODO já deixado no código). | Corrigido na Fase 4 |
| E5 | `docker-compose.yml` / `application.properties` | Senha do Postgres (`askia123`) hardcoded no repositório. | Corrigido na Fase 1/4 (`.env`) |
| E6 | `ask-ia.service.ts` | IA 100% mock (respostas fixas por regex). | Corrigido na Fase 2 |
| E7 | `revisao.service.ts` | Flashcards e Quiz 100% mock (fora do escopo deste plano — ver seção 3, "fora do escopo"). | Não tratado agora |
| E8 | Sem recuperação de senha | Usuário que esquece a senha não tem como recuperar a conta. | Corrigido na Fase 3 |

### 1.2 Pontos de atenção (não quebram, mas pesam)

- `auth.guard.ts` cita um "bug conhecido do backend, já reportado ao Jorge" (corpo vazio do `/auth/me`) que **já foi corrigido** no `AuthController` — comentário desatualizado, confunde quem lê depois.
- Fórmulas matemáticas na resposta da IA são texto puro (sem KaTeX/MathJax) — fica para depois do TCC, fora do escopo deste plano.
- `SessionAttribute("userId")` nos controllers depende implicitamente do `SessaoInterceptor` já ter barrado quem não está logado — funciona, mas é um acoplamento implícito entre duas camadas, vale um teste de integração.
- Schema do banco hoje é "fotografia" do que o Hibernate criava (`ddl-auto=update` antigo) — ao trocar para SQL puro, o schema final fica explícito e documentado por domínio.

### 1.3 Melhorias (fora de erro, mas valem a pena)

- Banco de dados criado por SQL puro em `db/`, direto no container do Postgres (sem Flyway) — Fase 1.
- IA real via OpenAI (Spring AI) — Fase 2.
- "Esqueci minha senha" via Resend — Fase 3.
- Segredos fora do código-fonte (`.env` + `.env.example`) — Fase 1/4.

## 2. Plano de execução

### Fase 1 — Banco de dados (Postgres puro via Docker)
1. Criar `db/` na raiz com os scripts SQL (um arquivo por domínio: usuários, matérias/tópicos, cronograma, conversas/mensagens, recuperação de senha).
2. `docker-compose.yml`: montar `./db` em `/docker-entrypoint-initdb.d` do serviço `db` (o Postgres roda os `.sql` sozinho na primeira subida, em ordem alfabética).
3. Remover `spring-boot-starter-flyway` e `flyway-database-postgresql` do `pom.xml`, remover `backend/src/main/resources/db/migration/`, remover propriedades `spring.flyway.*` do `application.properties`. `ddl-auto=validate` continua (Hibernate só confere, não cria).
4. Criar `.env` (gitignorado, já estava no `.gitignore`) com as credenciais de dev + placeholders das novas chaves, e `.env.example` versionado documentando o que cada variável faz.

### Fase 2 — Integração com OpenAI (Spring AI)
1. Ativar `spring-ai-starter-model-openai` no `pom.xml` (já estava comentado, só esperando a key).
2. `IaService`: monta o prompt (contrato: área/tópico/passos/fórmula/termos-chave `==...==`/tente-você, igual ao combinado no `ask-ia.service.ts`), chama o `ChatClient`, converte a resposta em `RespostaIaDTO` com `BeanOutputConverter`.
3. Novo `IaController` → `POST /api/ia/perguntar`: confere a cota **antes** de chamar o modelo (evita gastar chamada de API se o usuário já estourou o limite), chama `IaService`, grava com `ConversaService.registrarInteracao()`, devolve conversa + resposta + cota num único payload.
4. Remover `POST /api/conversas/interacoes` do `ConversaController` (fechava a brecha do E1).
5. Frontend: `ask-ia.service.ts` troca o mock por uma chamada HTTP só (`enviarPergunta` → `POST /api/ia/perguntar`), removendo `TEMAS`, `montarResposta`, `normalizar`, atalhos de teste ("erro"/"demora"). Atualizar `ask-ia.service.spec.ts`.
6. Também gerado por IA (adendo, Fase 6): flashcards (`RevisaoController`/`RevisaoService`) e quiz, sem persistência — cada geração é uma chamada nova, igual ao Ask IA.

### Fase 2b — OpenAI OU Gemini, por conta própria (adendo)
Decisão: não travar no provedor único. `IaService` continua igual (injeta `ChatClient.Builder`,
genérico — não sabe nem precisa saber qual provedor está por trás).
1. `pom.xml`: `spring-ai-starter-model-google-genai` ativado ao lado do `spring-ai-starter-model-openai`.
2. `application.properties`: propriedades dos dois provedores lado a lado (`spring.ai.openai.*` e
   `spring.ai.google.genai.*`), cada uma lendo sua key do `.env` com default vazio.
3. `IaProviderEnvironmentPostProcessor` (novo, `config/`, registrado em
   `META-INF/spring.factories`): decide, antes do Spring AI escolher qual autoconfiguração de
   chat ativar, o valor de `spring.ai.model.chat` — `google-genai` só quando `GEMINI_API_KEY`
   está preenchida e `OPENAI_API_KEY` não; em qualquer outro caso (só OpenAI, as duas, ou
   nenhuma), `openai`. Sem essa propriedade, as duas autoconfigurações tentariam subir juntas e
   dariam conflito de bean (`ChatClient.Builder` ambíguo).
4. Correção de bug encontrado nessa revisão: as propriedades do OpenAI estavam como
   `spring.ai.openai.chat.options.model`/`.options.temperature` — não existe esse prefixo
   `.options` no Spring AI 2.0 (é `spring.ai.openai.chat.model`/`.chat.temperature` direto). Elas
   eram ignoradas silenciosamente (sem erro, só o modelo/temperatura configurados nunca
   aplicavam — ficava no default `gpt-5-mini`). Corrigido junto.

### Fase 3 — Esqueci minha senha (Resend)
1. Tabela `tb_tokens_redefinicao_senha` (token **com hash**, nunca o valor puro; expira em 30 min; apagado ao ser usado).
2. `POST /auth/esqueci-senha` (sempre responde 200, não revela se o e-mail/nome existe), `POST /auth/redefinir-senha`.
3. `EmailService` chamando a API HTTP da Resend (`RestClient`, sem dependência nova).
4. Frontend: páginas `esqueci-senha` e `redefinir-senha` no mesmo estilo visual do login, link na tela de login.

### Fase 4 — Correções gerais
1. CORS e `apiUrl` configuráveis por variável de ambiente (`FRONTEND_URL`).
2. `GlobalExceptionHandler`: handler genérico para `Exception` → 500 com `{"message": "..."}" e log do erro real no servidor.
3. Limpeza do comentário desatualizado em `auth.guard.ts`.

### Fase 5 — Validação
1. `./mvnw clean compile` / `test` no backend.
2. `npm run build` no frontend.
3. Checklist manual: `docker compose up --build`, cadastro, login, pergunta real à IA, esqueci-senha ponta a ponta.

## 3. Fora do escopo deste plano (decisão consciente, não esquecimento)

- Flashcards e Quiz gerados por IA (hoje mock) — é trabalho de produto separado da integração de IA do Ask IA propriamente dito; recomendo um card à parte.
- Renderização de fórmulas com KaTeX/MathJax.
- XP, loja e conquistas (já documentado como "fora do escopo" em `docs/REGRAS_GAMIFICACAO.md`).
