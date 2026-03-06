begin;

create table if not exists public.rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  window_start timestamptz not null default now(),
  request_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, endpoint)
);

create index if not exists idx_rate_limits_window_start on public.rate_limits(window_start);

commit;
