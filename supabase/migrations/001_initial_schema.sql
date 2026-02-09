-- Post-it Dotes: Initial Schema
-- Run this in the Supabase SQL Editor

-- profiles: links Supabase auth to Dota identity
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  discord_username text,
  display_name text,
  dota_names text[] default '{}',
  steam_account_id bigint,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "Authenticated users have full access to profiles"
  on profiles for all to authenticated using (true) with check (true);

-- players: every player ever encountered
create table players (
  id uuid primary key default gen_random_uuid(),
  steam_account_id bigint unique,
  known_names text[] default '{}',
  top_heroes jsonb default '[]',
  top_heroes_updated_at timestamptz,
  profile_id uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

alter table players enable row level security;
create policy "Authenticated users have full access to players"
  on players for all to authenticated using (true) with check (true);

-- matches: each parsed game session
create table matches (
  id uuid primary key default gen_random_uuid(),
  dota_match_id bigint unique,
  raw_status_text text,
  opendota_fetched boolean default false,
  opendota_data jsonb,
  our_team_slot smallint check (our_team_slot in (1, 2)),
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

alter table matches enable row level security;
create policy "Authenticated users have full access to matches"
  on matches for all to authenticated using (true) with check (true);

-- match_players: junction table for players in a match
create table match_players (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  slot smallint not null check (slot between 1 and 10),
  team smallint generated always as (case when slot <= 5 then 1 else 2 end) stored,
  display_name text,
  hero_id integer,
  kills smallint,
  deaths smallint,
  assists smallint,
  unique (match_id, slot)
);

alter table match_players enable row level security;
create policy "Authenticated users have full access to match_players"
  on match_players for all to authenticated using (true) with check (true);

-- tags: shared tag definitions
create table tags (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  color text not null default '#6366f1',
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

alter table tags enable row level security;
create policy "Authenticated users have full access to tags"
  on tags for all to authenticated using (true) with check (true);

-- player_tags: junction table for tags on players
create table player_tags (
  player_id uuid not null references players(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  tagged_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  primary key (player_id, tag_id)
);

alter table player_tags enable row level security;
create policy "Authenticated users have full access to player_tags"
  on player_tags for all to authenticated using (true) with check (true);

-- notes: freeform notes on players
create table notes (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  author_id uuid references profiles(id) on delete set null,
  content text not null,
  match_id uuid references matches(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table notes enable row level security;
create policy "Authenticated users have full access to notes"
  on notes for all to authenticated using (true) with check (true);

-- merge_player RPC: atomic merge of name-only player into steam-id player
create or replace function merge_player(source_id uuid, target_id uuid)
returns void language plpgsql security definer as $$
begin
  -- move match_players
  update match_players set player_id = target_id where player_id = source_id;
  -- move notes
  update notes set player_id = target_id where player_id = source_id;
  -- move player_tags (skip duplicates)
  insert into player_tags (player_id, tag_id, tagged_by, created_at)
    select target_id, tag_id, tagged_by, created_at
    from player_tags where player_id = source_id
    on conflict (player_id, tag_id) do nothing;
  delete from player_tags where player_id = source_id;
  -- merge known_names
  update players set known_names = (
    select array(select distinct unnest(
      (select known_names from players where id = target_id) ||
      (select known_names from players where id = source_id)
    ))
  ) where id = target_id;
  -- delete orphan
  delete from players where id = source_id;
end;
$$;

-- Enable realtime on key tables
alter publication supabase_realtime add table notes;
alter publication supabase_realtime add table player_tags;
alter publication supabase_realtime add table match_players;
alter publication supabase_realtime add table matches;

-- Indexes for common queries
create index idx_players_steam_account_id on players(steam_account_id);
create index idx_match_players_match_id on match_players(match_id);
create index idx_match_players_player_id on match_players(player_id);
create index idx_notes_player_id on notes(player_id);
create index idx_player_tags_player_id on player_tags(player_id);
create index idx_matches_dota_match_id on matches(dota_match_id);
