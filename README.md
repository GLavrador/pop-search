# Pop Search

Uma aplicação web que funciona como acervo para indexação e busca de vídeos do Twitter usando IA Multimodal e validação humana.

## Sumário

- [Visão Geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Instalação](#instalação)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Uso da API](#uso-da-api)
- [Testes](#testes)

## Visão Geral

Pop Search permite:
- **Análise Automática de Vídeos**: Extrai metadados de vídeos usando IA multimodal (Gemini)
- **Busca Semântica**: Encontra vídeos por significado, não apenas palavras-chave
- **Indexação Inteligente**: Armazena embeddings vetoriais para busca

## Tecnologias

### Backend
- **FastAPI** - Framework web assíncrono
- **Supabase** - Banco de dados PostgreSQL com pgvector
- **Google Gemini** - IA multimodal para análise de vídeos
- **yt-dlp** - Download de vídeos

### Frontend
- **React + TypeScript**
- **Vite**

## Instalação

### Requisitos
- Python 3.11+
- Node.js 18+
- Conta Supabase com pgvector habilitado
- API Key do Google Gemini

### Backend

```bash
cd backend

# Criar ambiente virtual
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Instalar dependências
pip install -r requirements.txt

# Executar
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend

npm install
npm run dev
```

## Variáveis de Ambiente

Crie um arquivo `.env` na pasta `backend/`:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# Gemini
GEMINI_API_KEY=your-gemini-api-key

# CORS (opcional, padrão: http://localhost:3000)
CORS_ORIGINS=http://localhost:3000,https://your-frontend.com

# Logging (opcional, padrão: DEBUG)
LOG_LEVEL=INFO
```

## Uso da API

### Health Check
```bash
GET /
```
Retorna status da API.

### Analisar Vídeo
```bash
POST /videos/analyze
Content-Type: application/json

{
  "url": "https://twitter.com/user/status/123456"
}
```
Retorna metadados extraídos do vídeo pela IA.

**Rate Limit:** 5 requisições/minuto

### Salvar Vídeo
```bash
POST /videos
Content-Type: application/json

{
  "titulo_sugerido": "Gato laranja comendo ração",
  "descricao_completa": "Gato de pelo curto sentado na cozinha...",
  "url_original": "https://twitter.com/...",
  "metadados_estruturados": { ... }
}
```
Indexa o vídeo no banco de dados.

**Rate Limit:** 10 requisições/minuto

### Buscar Vídeos
```bash
POST /search
Content-Type: application/json

{
  "query": "gato laranja",
  "limit": 5,
  "threshold": 0.5
}
```
Busca vídeos por similaridade semântica.

**Rate Limit:** 20 requisições/minuto

## Testes

```bash
cd backend

# Ativar ambiente virtual
.\venv\Scripts\activate

# Executar todos os testes
python -m pytest tests/ -v

# Com cobertura
python -m pytest tests/ -v --cov=. --cov-report=html
```

## Estrutura do Projeto

```
backend/
├── main.py              # Entry point da aplicação
├── dtos.py              # Data Transfer Objects
├── db.py                # Conexão Supabase
├── core/
│   ├── gemini.py        # Config centralizada do Gemini
│   ├── limiter.py       # Rate limiting
│   ├── logger.py        # Configuração de logs
│   └── exceptions.py    # Exceções customizadas
├── routers/
│   ├── health.py        # Endpoint de saúde
│   ├── videos.py        # Endpoints de vídeos
│   └── search.py        # Endpoint de busca
├── services/
│   ├── ai.py            # Análise com Gemini
│   ├── downloader.py    # Download de vídeos
│   └── embedding.py     # Geração de embeddings
└── tests/
```
