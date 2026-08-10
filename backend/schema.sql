-- 1. enable the pgvector extension for embedding support
create extension if not exists vector;

-- 2. main table
create table videos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  url_original text unique not null,
  titulo_video text,
  descricao_completa text,
  metadados_estruturados jsonb,
-- Creates new vector
  embedding vector(768),
  -- Full-text column backing the lexical branch of the hybrid search.
  -- Only jsonb VALUES are indexed, never the keys.
  -- Weights: A = title, B = description, C = structured metadata.
  fts tsvector generated always as (
    setweight(
      to_tsvector('portuguese', coalesce(titulo_video, '')),
      'A'
    ) ||
    setweight(
      to_tsvector('portuguese', coalesce(descricao_completa, '')),
      'B'
    ) ||
    setweight(
      to_tsvector('portuguese',
        coalesce(metadados_estruturados -> 'audio' ->> 'transcricao', '') || ' ' ||
        coalesce(metadados_estruturados -> 'audio' ->> 'musica', '')     || ' ' ||
        coalesce(metadados_estruturados -> 'audio' ->> 'artista', '')    || ' ' ||
        coalesce(jsonb_path_query_array(
          metadados_estruturados, '$.pessoas[*].descricao')::text, '')   || ' ' ||
        coalesce(jsonb_path_query_array(
          metadados_estruturados, '$.elementos_cenario[*]')::text, '')
      ),
      'C'
    )
  ) stored
);

-- 3. HNSW index for fast vector search
create index on videos using hnsw (embedding vector_cosine_ops);

-- 4. GIN index for the full-text branch
create index videos_fts_idx on videos using gin (fts);


-- Hybrid search: vector + full-text combined via Reciprocal Rank Fusion.
--
-- RRF fuses the two result sets by each row's RANK, not by its raw score.
-- That is what makes the fusion correct: cosine similarity (0..1) and
-- ts_rank_cd (unbounded) live on incomparable scales and cannot simply be
-- added together.
--
-- search_mode:
--   'hybrid'   -> vector + full-text fused (default)
--   'semantic' -> vector only, honouring match_threshold
--   'text'     -> full-text only, match_threshold is ignored
--
-- match_threshold applies to the vector branch ONLY. Applying it to full-text
-- matches as well would collapse the hybrid search back into a vector-only one.

drop function if exists match_videos;

create or replace function match_videos (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  query_text text,
  search_mode text default 'hybrid',
  rrf_k int default 50
)
returns table (
  id uuid,
  titulo_video text,
  descricao_completa text,
  url_original text,
  similarity float,
  text_rank float,
  score float
)
language sql
stable
set search_path = public, extensions
as $$
  with vector_hits as (
    select
      v.id,
      1 - (v.embedding <=> query_embedding) as similarity,
      row_number() over (order by v.embedding <=> query_embedding) as rank
    from videos v
    where v.embedding is not null
    -- Ordering directly on the <=> operator is what allows the HNSW index to
    -- be used. Wrapping it in "1 - (...)" disables the index and forces a
    -- sequential scan over every row.
    order by v.embedding <=> query_embedding
    limit case
      when search_mode in ('hybrid', 'semantic')
      then least(greatest(match_count, 1) * 4, 200)
      else 0
    end
  ),
  text_hits as (
    select
      v.id,
      ts_rank_cd(v.fts, websearch_to_tsquery('portuguese', query_text)) as text_rank,
      row_number() over (
        order by ts_rank_cd(v.fts, websearch_to_tsquery('portuguese', query_text)) desc
      ) as rank
    from videos v
    -- websearch_to_tsquery supports quoted phrases, OR and -term, never raises
    -- on malformed input, and avoids the ILIKE wildcard problem where a "%"
    -- typed by the user would match every row.
    where v.fts @@ websearch_to_tsquery('portuguese', query_text)
    limit case
      when search_mode in ('hybrid', 'text')
      then least(greatest(match_count, 1) * 4, 200)
      else 0
    end
  ),
  fused as (
    select
      coalesce(vh.id, th.id) as video_id,
      coalesce(vh.similarity, 0)::float as sim,
      coalesce(th.text_rank, 0)::float as trank,
      (
        coalesce(1.0 / (rrf_k + vh.rank), 0) +
        coalesce(1.0 / (rrf_k + th.rank), 0)
      )::float as fused_score,
      (vh.id is not null and vh.similarity >= match_threshold) as passes_vector,
      (th.id is not null) as passes_text
    from vector_hits vh
    full outer join text_hits th on th.id = vh.id
  )
  select
    v.id,
    v.titulo_video,
    v.descricao_completa,
    v.url_original,
    f.sim,
    f.trank,
    f.fused_score
  from fused f
  join videos v on v.id = f.video_id
  where f.passes_vector or f.passes_text
  -- LIMIT is applied only here, after all filtering, so that match_count is
  -- honoured exactly (the "Max Results" dropdown depends on this).
  order by f.fused_score desc, f.sim desc
  limit greatest(match_count, 1);
$$;
