# Ask.IA

Plataforma de estudos para ENEM e vestibulares, com apoio de inteligência artificial para geração de conteúdo personalizado e um banco de questões/flashcards curado como alternativa independente de IA.

Projeto de TCC (Trabalho de Conclusão de Curso).

## O que o sistema faz

O Ask.IA organiza a rotina de estudos do usuário e oferece ferramentas de revisão ativa:

- **Ask IA** — chat com um assistente de estudos baseado em IA, para tirar dúvidas e pedir explicações.
- **Painel** — visão geral do progresso e dos próximos passos do usuário.
- **Matérias** — cadastro das matérias e tópicos que o usuário está estudando (com sugestões automáticas de matérias comuns do ENEM e exclusão com limpeza em cascata dos dados relacionados).
- **Cronograma** — organização de metas e sessões de estudo ao longo do tempo.
- **Flashcards** — geração de flashcards de revisão por matéria, via IA ou a partir do banco de conteúdo curado.
- **Quiz IA** — questões de múltipla escolha geradas por IA ou extraídas do banco de conteúdo, com feedback imediato.
- **Progresso** — acompanhamento do desempenho e da evolução do usuário nas matérias estudadas.

### Geração de conteúdo com fallback automático

Flashcards e quiz podem ser gerados de duas formas:

1. **Via IA** (padrão): o backend consulta um provedor de IA configurado (OpenAI ou Google Gemini) e gera conteúdo novo para a matéria/tópico pedido.
2. **Via banco de conteúdo curado**: um conjunto de questões e flashcards revisados manualmente, cobrindo as principais matérias do ENEM, armazenado no próprio banco de dados.

Se a chamada à IA falhar (API fora do ar, limite de uso, chave inválida, etc.), o backend cai automaticamente para o banco de conteúdo curado da mesma matéria, sem exigir ação do usuário. Isso garante que o produto continua funcional mesmo sem IA disponível, e ajuda a controlar custo de API. A resposta da API sempre indica se o conteúdo retornado veio da IA ou do banco (`doBanco`), e a interface mostra essa origem ao usuário. O usuário também pode optar manualmente por praticar direto com o banco de conteúdo, sem acionar a IA.

## Arquitetura

```
┌──────────────┐      ┌──────────────────┐      ┌──────────────┐
│   Frontend   │ ───► │      Backend      │ ───► │  PostgreSQL  │
│  Angular 22  │      │  Spring Boot 4.1  │      │      16      │
└──────────────┘      └─────────┬────────┘      └──────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   Provedor de IA        │
                    │  OpenAI ou Google Gemini│
                    │  (fallback automático   │
                    │   para o banco curado)  │
                    └────────────────────────┘
```

### Frontend

- **Angular 22** (standalone components, signals, zoneless change detection, nova sintaxe de controle de fluxo `@if`/`@for`).
- **Tailwind CSS 4** + CSS customizado com tema via custom properties (`:root` / `[data-tema]`), suportando modo claro/escuro.
- **Vitest** para testes unitários.
- Build de produção servido por um servidor Node/nginx dentro do container (porta interna 4000).

### Backend

- **Spring Boot 4.1.1** / **Java 21**.
- **Spring Security** com autenticação baseada em sessão (cookie de sessão HTTP, sem JWT), via interceptor próprio (`SessaoInterceptor`).
- **Spring Data JPA** para persistência.
- **Spring AI 2.0** com suporte a dois provedores de IA configuráveis, com fallback entre eles e para o banco de conteúdo curado:
  - **OpenAI** (`spring-ai-starter-model-openai`)
  - **Google Gemini** (`spring-ai-starter-model-google-genai`)
- `ChatClient` + `BeanOutputConverter` para obter respostas estruturadas (JSON) da IA.
- Envio de e-mails (recuperação de senha) via **Resend**.

### Banco de dados

- **PostgreSQL 16**.
- Schema gerenciado por **scripts SQL numerados** em `db/` (não usa Flyway nem outra ferramenta de migração). Esses scripts rodam automaticamente apenas na **primeira inicialização** do container do banco, quando o volume está vazio.
- O Hibernate está configurado com `ddl-auto=validate`: ele não cria nem altera tabelas, apenas valida se o schema do banco é compatível com as entidades JPA. Qualquer divergência (tipo de coluna, nome, etc.) impede o backend de subir.

## Como rodar o projeto localmente

### Pré-requisitos

- Docker e Docker Compose.

### Passo a passo

1. Copie o arquivo de exemplo de variáveis de ambiente e preencha com suas credenciais:

   ```bash
   cp .env.example .env
   ```

   Preencha pelo menos as chaves de IA que você for usar (`OPENAI_API_KEY` e/ou `GEMINI_API_KEY`) e, se quiser envio de e-mail de recuperação de senha, `RESEND_API_KEY`.

2. Suba os containers:

   ```bash
   docker compose up -d --build
   ```

3. Acesse a aplicação em [http://localhost:4200](http://localhost:4200). O backend fica exposto em `http://localhost:8080` e o Postgres em `localhost:5432`.

### Sobre o schema do banco

Os scripts em `db/*.sql` só são executados pelo Postgres **na primeira vez que o volume `askia_db_data` é criado vazio**. Se você alterar algum script SQL depois que o volume já existe, a alteração **não** será aplicada automaticamente. Para recriar o schema do zero:

```bash
docker compose down -v
docker compose up -d --build
```

> `down -v` remove o volume de dados do Postgres — use com cuidado em ambientes com dados que você queira manter.

## Estrutura do repositório

```
ProjetoAskIA/
├── backend/        # API Spring Boot (Java 21)
│   └── src/main/java/com/aski/IA/
│       ├── config/       # Configurações (segurança, IA, CORS, etc.)
│       ├── controller/   # Endpoints REST
│       ├── dto/          # Objetos de transferência de dados
│       ├── exception/    # Exceções e tratamento de erros
│       ├── model/        # Entidades JPA
│       ├── repository/   # Repositórios Spring Data JPA
│       └── service/      # Regras de negócio
├── frontend/       # Aplicação Angular 22
│   └── src/app/
│       ├── core/          # Utilidades e dados compartilhados
│       ├── pages/         # Páginas da aplicação (login, matérias, quiz, etc.)
│       ├── services/      # Comunicação com a API
│       └── shared/        # Componentes reutilizáveis
├── db/             # Scripts SQL de schema e seed (ordem numérica)
├── docker-compose.yml
└── .env.example
```

## Variáveis de ambiente

Veja `.env.example` para a lista completa. As principais:

| Variável | Descrição |
|---|---|
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Credenciais do PostgreSQL |
| `FRONTEND_URL` | URL do frontend, usada na configuração de CORS |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | Credencial e modelo da OpenAI |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Credencial e modelo do Google Gemini |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Envio de e-mail de recuperação de senha |
| `COOKIE_SECURE` | Define se o cookie de sessão exige HTTPS |

Nenhuma IA configurada? O sistema continua funcional: flashcards e quiz usam automaticamente o banco de conteúdo curado.
