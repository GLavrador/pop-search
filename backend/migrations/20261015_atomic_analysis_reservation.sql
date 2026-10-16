begin;

create or replace function public.reserve_analysis(
  p_user_id uuid,
  p_job_id uuid,
  p_url text,
  p_analyze_scenes boolean,
  p_analyze_audio boolean
)
returns setof public.analysis_jobs
language sql
security invoker
set search_path = public
as $$
  insert into public.analysis_jobs as stored (
    user_id, id, url, analyze_scenes, analyze_audio, stage,
    result, error_status, error_detail, created_at, updated_at
  ) values (
    p_user_id, p_job_id, p_url, p_analyze_scenes, p_analyze_audio, 'queued',
    null, null, null, now(), now()
  )
  on conflict (user_id) do update set
    id = excluded.id,
    url = excluded.url,
    analyze_scenes = excluded.analyze_scenes,
    analyze_audio = excluded.analyze_audio,
    stage = excluded.stage,
    result = excluded.result,
    error_status = excluded.error_status,
    error_detail = excluded.error_detail,
    created_at = excluded.created_at,
    updated_at = excluded.updated_at
  where stored.stage in ('done', 'failed')
    or stored.updated_at < now() - interval '10 minutes'
    or stored.id = excluded.id
  returning *;
$$;

revoke all on function public.reserve_analysis(uuid, uuid, text, boolean, boolean)
  from public, anon, authenticated;
grant execute on function public.reserve_analysis(uuid, uuid, text, boolean, boolean)
  to service_role;

commit;
