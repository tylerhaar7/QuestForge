begin;

-- Enable RLS
alter table if exists public.characters enable row level security;
alter table if exists public.campaigns enable row level security;
alter table if exists public.companion_states enable row level security;
alter table if exists public.rate_limits enable row level security;

-- Drop old policies defensively
drop policy if exists "characters_select_own" on public.characters;
drop policy if exists "characters_insert_own" on public.characters;
drop policy if exists "characters_update_own" on public.characters;
drop policy if exists "characters_delete_own" on public.characters;

drop policy if exists "campaigns_select_own" on public.campaigns;
drop policy if exists "campaigns_insert_own" on public.campaigns;
drop policy if exists "campaigns_update_own" on public.campaigns;
drop policy if exists "campaigns_delete_own" on public.campaigns;

drop policy if exists "companion_states_select_own" on public.companion_states;
drop policy if exists "companion_states_insert_own" on public.companion_states;
drop policy if exists "companion_states_update_own" on public.companion_states;
drop policy if exists "companion_states_delete_own" on public.companion_states;

drop policy if exists "rate_limits_select_own" on public.rate_limits;
drop policy if exists "rate_limits_insert_own" on public.rate_limits;
drop policy if exists "rate_limits_update_own" on public.rate_limits;
drop policy if exists "rate_limits_delete_own" on public.rate_limits;

-- characters
create policy "characters_select_own"
on public.characters for select
to authenticated
using (user_id = auth.uid());

create policy "characters_insert_own"
on public.characters for insert
to authenticated
with check (user_id = auth.uid());

create policy "characters_update_own"
on public.characters for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "characters_delete_own"
on public.characters for delete
to authenticated
using (user_id = auth.uid());

-- campaigns
create policy "campaigns_select_own"
on public.campaigns for select
to authenticated
using (user_id = auth.uid());

create policy "campaigns_insert_own"
on public.campaigns for insert
to authenticated
with check (user_id = auth.uid());

create policy "campaigns_update_own"
on public.campaigns for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "campaigns_delete_own"
on public.campaigns for delete
to authenticated
using (user_id = auth.uid());

-- companion_states (ownership via campaign join)
create policy "companion_states_select_own"
on public.companion_states for select
to authenticated
using (
  exists (
    select 1 from public.campaigns c
    where c.id = companion_states.campaign_id
      and c.user_id = auth.uid()
  )
);

create policy "companion_states_insert_own"
on public.companion_states for insert
to authenticated
with check (
  exists (
    select 1 from public.campaigns c
    where c.id = companion_states.campaign_id
      and c.user_id = auth.uid()
  )
);

create policy "companion_states_update_own"
on public.companion_states for update
to authenticated
using (
  exists (
    select 1 from public.campaigns c
    where c.id = companion_states.campaign_id
      and c.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.campaigns c
    where c.id = companion_states.campaign_id
      and c.user_id = auth.uid()
  )
);

create policy "companion_states_delete_own"
on public.companion_states for delete
to authenticated
using (
  exists (
    select 1 from public.campaigns c
    where c.id = companion_states.campaign_id
      and c.user_id = auth.uid()
  )
);

-- rate_limits
create policy "rate_limits_select_own"
on public.rate_limits for select
to authenticated
using (user_id = auth.uid());

create policy "rate_limits_insert_own"
on public.rate_limits for insert
to authenticated
with check (user_id = auth.uid());

create policy "rate_limits_update_own"
on public.rate_limits for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "rate_limits_delete_own"
on public.rate_limits for delete
to authenticated
using (user_id = auth.uid());

commit;
