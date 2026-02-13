alter table matches
  add column opendota_parse_requested_at timestamptz,
  add column opendota_parse_attempts smallint default 0;

create index idx_matches_opendota_pending
  on matches (created_at)
  where opendota_fetched = false and dota_match_id is not null;
