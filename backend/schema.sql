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


-- Buscar Vídeos
-- 1. cria uma função para buscar vídeos similares por embeddings
create or replace function match_videos (
  query_embedding vector(768), -- vetor da consulta (mesma dimensão do modelo)
  match_threshold float,       -- grau mínimo de similaridade para retornar (0 a 1)
  match_count int              -- limite de registros retornados
)
returns table (
  id uuid,
  titulo_video text,
  resumo text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    videos.id,
    videos.titulo_video,
    videos.resumo,
    -- similaridade de cosseno para score
    1 - (videos.embedding <=> query_embedding) as similarity
  from videos
  -- apenas os vídeos que atingem a similaridade mínima exigida
  where 1 - (videos.embedding <=> query_embedding) > match_threshold
  -- ordena os resultados de mais similar para menos similar e limita a quantidade
  order by similarity desc
  limit match_count;
end;
$$;