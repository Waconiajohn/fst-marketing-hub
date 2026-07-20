-- Lock RLS so only a server-minted `authenticated` JWT can read or write app data.
--
-- Before: every table had one policy — "Allow all operations" TO public (which
-- includes anon), so the public anon key returned by /api/config granted full
-- read/write. After: the same access requires the `authenticated` role, which the
-- browser only gets after logging in (see api/login.js + api/_auth.js). A leaked
-- anon key alone can no longer touch these tables.
--
-- public.leads is deliberately EXCLUDED: it keeps its "anon can insert leads"
-- policy for the public lead-capture form and is not part of this app's tables.
--
-- Applied to project fst-marketing-hub (pfljotvsaxbwfzzwdnui) 2026-07-19.

do $$
declare
  t text;
begin
  foreach t in array array[
    'marketing_assets', 'prospects', 'b2b_accounts', 'b2b_touches',
    'publish_targets', 'published_posts', 'weekly_metrics'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "Allow all operations" on public.%I', t);
    execute format('drop policy if exists "Authenticated full access" on public.%I', t);
    execute format(
      'create policy "Authenticated full access" on public.%I '
      || 'for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;
