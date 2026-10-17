begin;

-- Every account and every video already here stays approved: the column is
-- added with true, and only then does a new account start without it.
alter table public.profiles add column approved boolean not null default true;
alter table public.profiles alter column approved set default false;

-- Videos keep true as their default, so a backend from before this change
-- still saves public videos. The backend now always says which it is.
alter table public.videos add column approved boolean not null default true;

-- An account under review keeps one video at a time, however many requests race.
create unique index videos_one_pending_per_user on public.videos (user_id) where not approved;

alter table public.usage_events add column while_pending boolean not null default false;

drop policy "videos: public read" on public.videos;

create policy "videos: approved, or the owner's own"
  on public.videos for select
  using (approved or auth.uid() = user_id);

create or replace function public.approve_account(p_user_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.profiles set approved = true where id = p_user_id and not approved;
  if not found then
    return false;
  end if;

  update public.videos set approved = true where user_id = p_user_id and not approved;
  return true;
end;
$$;

revoke all on function public.approve_account(uuid) from public, anon, authenticated;
grant execute on function public.approve_account(uuid) to service_role;

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
  score float,
  post jsonb,
  vector_position int,
  text_position int,
  fusion_k int,
  matched text
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
      and v.approved
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
      ts_rank_cd(v.fts, websearch_to_tsquery('portuguese_unaccent', query_text)) as text_rank,
      row_number() over (
        order by ts_rank_cd(v.fts, websearch_to_tsquery('portuguese_unaccent', query_text)) desc
      ) as rank
    from videos v
    where v.fts @@ websearch_to_tsquery('portuguese_unaccent', query_text)
      and v.approved
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
      vh.rank::int as vector_place,
      th.rank::int as text_place,
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
    f.fused_score,
    v.post,
    f.vector_place,
    f.text_place,
    rrf_k,
    case when f.text_place is not null then
      ts_headline(
        'portuguese_unaccent',
        concat_ws(' | ',
          nullif(v.titulo_video, ''),
          nullif(v.descricao_completa, ''),
          nullif(v.post ->> 'texto', ''),
          nullif(v.metadados_estruturados -> 'audio' ->> 'transcricao', ''),
          nullif(v.metadados_estruturados -> 'audio' ->> 'musica', ''),
          nullif(v.metadados_estruturados -> 'audio' ->> 'artista', ''),
          nullif(array_to_string(array(
            select jsonb_array_elements_text(jsonb_path_query_array(
              v.metadados_estruturados, '$.pessoas[*].descricao'))), ', '), ''),
          nullif(array_to_string(array(
            select jsonb_array_elements_text(jsonb_path_query_array(
              v.metadados_estruturados, '$.elementos_cenario[*]'))), ', '), '')
        ),
        websearch_to_tsquery('portuguese_unaccent', query_text),
        'StartSel=<<, StopSel=>>, MaxFragments=2, MaxWords=14, MinWords=5'
      )
    end
  from fused f
  join videos v on v.id = f.video_id
  where f.passes_vector or f.passes_text
  order by f.fused_score desc, f.sim desc
  limit greatest(match_count, 1);
$$;

commit;
