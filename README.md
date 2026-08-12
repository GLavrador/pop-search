# Pop Search

Acervo de vídeos do Twitter/X indexados por IA multimodal, com busca híbrida
(significado + palavras) e validação humana antes de qualquer coisa entrar no
índice.

## Sumário

- [Visão geral](#visão-geral)
- [Como a busca funciona](#como-a-busca-funciona)
- [Contas e limites](#contas-e-limites)
- [Tecnologias](#tecnologias)
- [Instalação](#instalação)
  - [1. Banco de dados](#1-banco-de-dados)
  - [2. Autenticação no Supabase](#2-autenticação-no-supabase)
  - [3. Variáveis de ambiente](#3-variáveis-de-ambiente)
  - [4. Rodar](#4-rodar)
- [Uso da API](#uso-da-api)
- [Testes](#testes)
- [Estrutura do projeto](#estrutura-do-projeto)

## Visão geral

- **Análise automática**: o Gemini assiste ao vídeo e escreve título, descrição,
  pessoas, elementos de cenário e transcrição do áudio
- **Revisão humana**: nada é indexado antes de a pessoa conferir e editar
- **Busca híbrida**: encontra por significado e por palavra exata, fundindo os
  dois rankings
- **Entrada manual**: dá para catalogar um vídeo sem usar IA
- **Contas com limite mensal**: contribuir exige cadastro; buscar não
- **Tour guiado**: visitantes conhecem o app inteiro sem criar conta e sem gastar
  chamada de IA

## Como a busca funciona

Cada vídeo é guardado de duas formas: um **embedding** de 768 dimensões
(significado) e uma coluna **`tsvector`** com pesos (palavras). A busca consulta
as duas e funde os resultados com **Reciprocal Rank Fusion**, que combina pela
*posição* em cada ranking - necessário porque similaridade de cosseno (0 a 1) e
`ts_rank_cd` (ilimitado) vivem em escalas incomparáveis e não podem ser somadas.

Três modos, escolhidos pelo usuário:

| Modo | Como um vídeo entra no resultado |
|---|---|
| `hybrid` | Por significado **ou** por palavra exata (padrão) |
| `semantic` | Só por significado, respeitando o limiar |
| `text` | Só por palavra exata; o limiar não se aplica |

O limiar de similaridade afeta **apenas o ramo vetorial**. Um vídeo que contém o
termo buscado aparece em qualquer limiar.

O ramo textual aceita `"frase exata"`, `-excluir` e `a or b`. Palavras soltas são
combinadas com **E**: cada palavra a mais restringe.

Acentos são normalizados dos dois lados da comparação por uma configuração de
busca própria (`portuguese_unaccent`), então `musica` encontra `música`.

## Contas e limites

Buscar é aberto a todos. Adicionar vídeo exige conta, porque cada análise custa
tempo de IA.

- Cada conta tem um **limite mensal de análises**, que renova no dia 1º
- **Análises que falham também contam**, porque os tokens foram gastos de todo
  jeito; o motivo da falha fica registrado
- **Recusa do Google não conta**, porque nada foi processado
- **Entrada manual não consome o limite**
- Existe um **teto diário do projeto inteiro**, somando todos os usuários, para
  a cota do Gemini não acabar sem aviso

Contas marcadas como `is_admin` veem uma aba de estatísticas com custo médio e
mediano por análise, taxa de falha, volume diário e consumo por usuário.

## Tecnologias

**Backend** - FastAPI, Supabase (PostgreSQL + pgvector), Google Gemini, yt-dlp \
**Frontend** - React, TypeScript, Vite, TanStack Query, Supabase Auth

## Instalação

### Requisitos

- Python 3.10+
- Node.js 18+
- Projeto Supabase
- API key do Google Gemini ([AI Studio](https://aistudio.google.com))

### 1. Banco de dados

No **SQL Editor** do Supabase, execute o conteúdo de
[`backend/schema.sql`](backend/schema.sql). Ele cria tudo do zero: extensões,
configuração de busca sem acentos, tabelas, índices, RLS e a função de busca.

> O projeto **não usa ferramenta de migração**. O `schema.sql` é a fonte de
> verdade para um banco novo; alterações em um banco existente são aplicadas à
> mão no SQL Editor.

Confira que o RLS ficou correto:

```sql
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
order by tablename;
```

Devem existir **apenas políticas de `SELECT`**. A ausência de política de escrita
em `videos` é proposital: é o que impede um usuário logado de inserir direto pelo
navegador e contornar a verificação de limite feita no backend.

### 2. Autenticação no Supabase

No painel:

1. **Authentication → Providers → Email**: habilite. Desmarcar *Confirm email*
   facilita o desenvolvimento
2. **Authentication → URL Configuration**: `Site URL` = `http://localhost:5173`
3. **Settings → API Keys**: copie a chave `anon` e a `service_role`
4. **Settings → JWT Keys**: copie o segredo

Para se tornar admin, depois de criar sua conta pelo app:

```sql
update profiles set is_admin = true where id = '<seu-uuid>';
```

### 3. Variáveis de ambiente

`backend/.env` (veja [`.env.example`](backend/.env.example)):

```env
SUPABASE_URL="https://seu-projeto.supabase.co"
SUPABASE_SERVICE_KEY="..." 
SUPABASE_JWT_SECRET="..."
GEMINI_API_KEY="..."
DAILY_ANALYSIS_LIMIT=100
LOG_LEVEL=DEBUG
```

`frontend/.env`:

```env
VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
VITE_SUPABASE_ANON_KEY="..."
```

> A `service_role` ignora todas as regras de segurança do banco. Ela só existe no
> servidor e **nunca** pode ir para o frontend nem para o versionamento.

`DAILY_ANALYSIS_LIMIT` é um valor inicial, não uma recomendação. Calibre pelo
teto real em *Google Cloud Console → APIs & Services → Generative Language API →
Quotas*, dividido pela média de tokens por análise que a aba de estatísticas
mostra.

### 4. Rodar

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate      # Windows
source venv/bin/activate     # Linux/Mac
pip install -r requirements.txt
uvicorn main:app --reload
```

```bash
cd frontend
npm install
npm run dev
```

## Uso da API

Endpoints autenticados esperam `Authorization: Bearer <access_token>`, o token de
sessão do Supabase Auth.

### Buscar vídeos - público

```http
POST /search
Content-Type: application/json

{
  "query": "gato laranja",
  "limit": 5,
  "threshold": 0.6,
  "mode": "hybrid"
}
```

Cada resultado traz `similarity`, `text_rank` e `score`, o que permite saber se
casou por significado, por palavra ou pelos dois. **20 req/min.**

### Analisar vídeo - requer conta

```http
POST /videos/analyze
Authorization: Bearer <token>

{
  "url": "https://x.com/user/status/123",
  "analyze_scenes": true,
  "analyze_audio": true
}
```

Só aceita links de `twitter.com` e `x.com`. Consome uma análise da cota mensal.
**5 req/min.**

Respostas possíveis: `401` sem sessão, `429` sem cota, `503` se o serviço de IA
ou o teto diário do projeto estiverem esgotados, `422` se a IA recusar o
conteúdo, `504` no timeout.

### Salvar vídeo - requer conta

```http
POST /videos
Authorization: Bearer <token>

{
  "titulo_sugerido": "...",
  "descricao_completa": "...",
  "url_original": "https://x.com/...",
  "metadados_estruturados": { ... }
}
```

Indexa o vídeo em nome de quem chamou. Não consome o limite de análises, mas gera
um embedding. **10 req/min.**

### Conta

| Endpoint | Retorna |
|---|---|
| `GET /me/quota` | Análises usadas, limite, renovação e tokens do mês |
| `GET /me/videos` | Os próprios vídeos, mais recentes primeiro |
| `GET /me/is-admin` | Se a conta é administradora |
| `GET /me/all-usage` | Consumo por conta *(admin)* |
| `GET /me/admin/stats?days=30` | Estatísticas do projeto, 7/30/90 dias *(admin)* |

## Testes

```bash
cd backend
.\venv\Scripts\activate
python -m pytest -q
```

O CI injeta **credenciais falsas**. Antes de abrir PR, rode desse jeito também -
um teste que esquece de mockar o Supabase passa com o `.env` real e quebra no CI:

```bash
SUPABASE_URL="https://fake.supabase.co" SUPABASE_KEY="fake-key" \
SUPABASE_SERVICE_KEY="" SUPABASE_JWT_SECRET="" GEMINI_API_KEY="fake-key" \
python -m pytest -q
```

Existe um guarda no `conftest.py` que faz esse erro falhar com mensagem clara em
vez de bater na rede.

```bash
cd frontend
npm run test
npx tsc --noEmit
```

## Estrutura do projeto

```
backend/
├── main.py                  # Entry point, CORS, rate limiting
├── schema.sql               # Fonte de verdade do banco
├── dtos.py                  # DTOs e limites de validação
├── db.py                    # Cliente Supabase (service_role)
├── core/
│   ├── auth.py              # Verificação do JWT do Supabase
│   ├── gemini.py            # Configuração do Gemini
│   ├── exceptions.py        # Domínios permitidos e erros de domínio
│   ├── limiter.py           # Rate limiting por IP
│   └── logger.py            # Logs
├── routers/
│   ├── health.py            # Healthcheck
│   ├── videos.py            # Análise e indexação
│   ├── search.py            # Busca híbrida
│   └── me.py                # Conta, cota e estatísticas
├── services/
│   ├── ai.py                # Prompt e chamada ao Gemini
│   ├── downloader.py        # Download via yt-dlp
│   ├── embedding.py         # Geração de embeddings
│   └── usage.py             # Cota, contabilidade e agregações
└── tests/

frontend/src/
├── components/              # Um diretório por componente, com CSS Module
├── context/                 # Sessão e barra de status
├── hooks/                   # Queries e mutations
├── services/api.ts          # Cliente HTTP, anexa o token
├── constants/               # Presets, modos e dados do tour
└── lib/supabase.ts          # Cliente Supabase (só autenticação)
```
