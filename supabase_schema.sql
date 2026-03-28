-- Run this in your Supabase project → SQL Editor

-- Games
create table if not exists games (
  id text primary key,
  title text,
  axis_top text not null,
  axis_bottom text not null,
  axis_left text not null,
  axis_right text not null,
  host_session_id text not null,
  state text not null default 'self_placement',
  created_at timestamptz default now()
);

-- Players (add 'color' column for avatar color)
create table if not exists players (
  id text primary key,
  game_id text references games(id) on delete cascade,
  name text not null,
  avatar_url text,
  color text,
  session_id text not null,
  joined_at timestamptz default now()
);

-- Assignments
create table if not exists assignments (
  id text primary key,
  game_id text references games(id) on delete cascade,
  assigner_id text references players(id) on delete cascade,
  target_id text references players(id) on delete cascade
);

-- Placements
create table if not exists placements (
  id text primary key,
  game_id text references games(id) on delete cascade,
  placed_player_id text references players(id) on delete cascade,
  placed_by_player_id text references players(id) on delete cascade,
  type text not null check (type in ('self', 'assigned')),
  x real not null,
  y real not null,
  submitted_at timestamptz default now()
);

-- RLS: allow all access via anon key (hackathon mode)
alter table games enable row level security;
alter table players enable row level security;
alter table assignments enable row level security;
alter table placements enable row level security;

create policy "allow all" on games for all using (true) with check (true);
create policy "allow all" on players for all using (true) with check (true);
create policy "allow all" on assignments for all using (true) with check (true);
create policy "allow all" on placements for all using (true) with check (true);

-- Enable Realtime (run in Supabase Dashboard → Database → Replication → enable for all 4 tables)
-- OR run:
-- alter publication supabase_realtime add table games;
-- alter publication supabase_realtime add table players;
-- alter publication supabase_realtime add table assignments;
-- alter publication supabase_realtime add table placements;
