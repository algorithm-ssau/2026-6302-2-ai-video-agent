alter table if exists public.vk_communities
  add column if not exists user_access_token text;
