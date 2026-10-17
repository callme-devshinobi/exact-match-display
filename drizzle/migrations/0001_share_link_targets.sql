create table public.share_links (
  id text primary key,
  target_url text not null,
  created_at timestamptz not null default now()
);

grant all on public.share_links to service_role;

alter table public.share_links enable row level security;