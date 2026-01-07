-- Supabase schema for wishlist

-- Visitors table
CREATE TABLE IF NOT EXISTS visitors (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Items table: each visitor can have at most one item (unique visitor_id)
CREATE TABLE IF NOT EXISTS items (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  visitor_id BIGINT NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT unique_visitor_item UNIQUE(visitor_id)
);

-- Optional view for easy selects joining visitor name
CREATE OR REPLACE VIEW items_view AS
SELECT i.id, i.title, i.visitor_id, v.name AS visitor_name, i.created_at
FROM items i JOIN visitors v ON i.visitor_id = v.id
ORDER BY i.created_at DESC;

-- NOTE: For a public setup consider configuring RLS and policies. For initial demo you may keep RLS disabled
-- and use the project's anon key, but this is not secure for production.
