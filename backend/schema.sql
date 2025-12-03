-- 1 habilita a extensão pgvector para trabalhar com embeddings
create extension if not exists vector;

-- 2 cria a tabela principal
create table videos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  url_original text unique not null,
  titulo_video text,
  resumo text,
  -- armazenamento dos objetos aninhados como JSONB
  metadados_visuais jsonb, 
  metadados_audio jsonb,
  tags_busca text[], 
  sentimento text,
  -- tamanho 768 é específico para o modelo text-embedding-004 do Google
  embedding vector(768)
);

-- 3. cria um índice para busca vetorial rápida (HNSW)
create index on videos using hnsw (embedding vector_cosine_ops);