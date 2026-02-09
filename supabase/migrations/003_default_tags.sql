INSERT INTO tags (name, color, created_by) VALUES
  ('skilled',       '#10b981', NULL),
  ('toxic',         '#ef4444', NULL),
  ('friendly',      '#84cc16', NULL),
  ('hero spammer',  '#f97316', NULL),
  ('smurf',         '#8b5cf6', NULL),
  ('tilter',        '#f59e0b', NULL),
  ('good support',  '#3b82f6', NULL),
  ('avoid',         '#ec4899', NULL)
ON CONFLICT (name) DO NOTHING;
