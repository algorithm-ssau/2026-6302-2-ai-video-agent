create table if not exists public.vk_communities (
  id bigserial primary key,
  user_id text not null,
  community_id bigint not null,
  community_name text,
  access_token text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, community_id)
);

create index if not exists idx_vk_communities_user_id
  on public.vk_communities (user_id);

create index if not exists idx_vk_communities_user_active
  on public.vk_communities (user_id, is_active);
