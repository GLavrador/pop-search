-- 1 habilita a extensão pgvector para trabalhar com embeddings
create extension if not exists vector;

-- 2 cria a tabela principal
create table videos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  url_original text unique not null,
  titulo_video text,
  descricao_completa text,
  metadados_estruturados jsonb,
  -- DEPRECATED: manter para compatibilidade com dados antigos
  resumo text,
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
drop function if exists match_videos;

create or replace function match_videos (
  query_embedding vector(768), -- vetor da consulta (mesma dimensão do modelo)
  match_threshold float,       -- grau mínimo de similaridade para retornar (0 a 1)
  match_count int,             -- limite de registros retornados
  query_text text              -- para busca textual
)
returns table (
  id uuid,
  titulo_video text,
  descricao_completa text,
  resumo text,  -- para compatibilidade com dados antigos
  url_original text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    videos.id,
    videos.titulo_video,
    videos.descricao_completa,
    videos.resumo,
    videos.url_original,
    -- similaridade de cosseno para score
    1 - (videos.embedding <=> query_embedding) as similarity
  from videos
  where 
    -- condição 1: similaridade vetorial
    (1 - (videos.embedding <=> query_embedding) > match_threshold)
    OR 
    -- condição 2: match exato de texto no título
    (videos.titulo_video ILIKE '%' || query_text || '%')
    OR
    -- condição 3: match no novo campo descricao_completa
    (videos.descricao_completa ILIKE '%' || query_text || '%')
    OR
    -- condição 4: backward compatibility com resumo
    (videos.resumo ILIKE '%' || query_text || '%')
  order by similarity desc
  limit match_count;
end;
$$;