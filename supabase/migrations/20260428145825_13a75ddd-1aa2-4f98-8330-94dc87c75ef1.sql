create table if not exists public.module_settings (
  key text primary key,
  enabled_modules jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

alter table public.module_settings enable row level security;

drop policy if exists "module_settings_read_all" on public.module_settings;
create policy "module_settings_read_all"
  on public.module_settings
  for select
  to authenticated
  using (true);

drop policy if exists "module_settings_insert_authenticated" on public.module_settings;
create policy "module_settings_insert_authenticated"
  on public.module_settings
  for insert
  to authenticated
  with check (true);

drop policy if exists "module_settings_update_authenticated" on public.module_settings;
create policy "module_settings_update_authenticated"
  on public.module_settings
  for update
  to authenticated
  using (true)
  with check (true);

insert into public.module_settings (key, enabled_modules)
values (
  'global',
  '["pipeline","deals","crm","signals","indicators","integrations","leads","properties","campaigns","outbox","payroll","intelligence","briefs","team","tools.space","tools.cost","tools.brochure","settings"]'::jsonb
)
on conflict (key) do nothing;

alter publication supabase_realtime add table public.module_settings;