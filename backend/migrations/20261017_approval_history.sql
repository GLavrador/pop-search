begin;

-- When each account was approved, for the list of recent approvals in Stats.exe.
-- The accounts approved before this stay without a date and out of that list.
alter table public.profiles add column approved_at timestamptz;

create or replace function public.approve_account(p_user_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.profiles set approved = true, approved_at = now() where id = p_user_id and not approved;
  if not found then
    return false;
  end if;

  update public.videos set approved = true where user_id = p_user_id and not approved;
  return true;
end;
$$;

revoke all on function public.approve_account(uuid) from public, anon, authenticated;
grant execute on function public.approve_account(uuid) to service_role;

commit;
