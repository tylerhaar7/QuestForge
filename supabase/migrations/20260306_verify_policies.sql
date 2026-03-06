select schemaname, tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('characters','campaigns','companion_states','rate_limits')
order by tablename, cmd, policyname;
