-- Convert match_players.team from generated column to regular column
-- so players can be reassigned between teams from the UI.
-- Run this in the Supabase SQL Editor.

ALTER TABLE match_players DROP COLUMN team;
ALTER TABLE match_players ADD COLUMN team SMALLINT;
UPDATE match_players SET team = CASE WHEN slot <= 5 THEN 1 ELSE 2 END;
ALTER TABLE match_players ALTER COLUMN team SET NOT NULL;
