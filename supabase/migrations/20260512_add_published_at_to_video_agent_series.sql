alter table public.video_agent_series
add column if not exists published_at timestamptz;

