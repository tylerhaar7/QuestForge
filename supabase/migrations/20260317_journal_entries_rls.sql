-- Enable RLS on journal_entries and add ownership policies via campaign join
-- (journal_entries has no user_id column — ownership is derived from campaigns.user_id)

begin;

alter table if exists public.journal_entries enable row level security;

-- Drop defensively
drop policy if exists "journal_entries_select_own" on public.journal_entries;
drop policy if exists "journal_entries_insert_own" on public.journal_entries;
drop policy if exists "journal_entries_update_own" on public.journal_entries;
drop policy if exists "journal_entries_delete_own" on public.journal_entries;

create policy "journal_entries_select_own"
on public.journal_entries for select
to authenticated
using (
  exists (
    select 1 from public.campaigns c
    where c.id = journal_entries.campaign_id
      and c.user_id = auth.uid()
  )
);

create policy "journal_entries_insert_own"
on public.journal_entries for insert
to authenticated
with check (
  exists (
    select 1 from public.campaigns c
    where c.id = journal_entries.campaign_id
      and c.user_id = auth.uid()
  )
);

create policy "journal_entries_update_own"
on public.journal_entries for update
to authenticated
using (
  exists (
    select 1 from public.campaigns c
    where c.id = journal_entries.campaign_id
      and c.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.campaigns c
    where c.id = journal_entries.campaign_id
      and c.user_id = auth.uid()
  )
);

create policy "journal_entries_delete_own"
on public.journal_entries for delete
to authenticated
using (
  exists (
    select 1 from public.campaigns c
    where c.id = journal_entries.campaign_id
      and c.user_id = auth.uid()
  )
);

commit;
