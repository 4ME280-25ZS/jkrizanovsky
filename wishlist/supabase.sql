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

-- Row-Level Security (RLS) policies
-- Recommended approach: require users to authenticate with Supabase Auth and associate visitors with auth user ids.

-- Enable extensions (for UUID generation if needed)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Add user_id to visitors to link visitors to authenticated users
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Enable RLS on visitors and items
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Allow anyone to select visitors/items (public read)
CREATE POLICY "select_visitors" ON visitors FOR SELECT USING (true);
CREATE POLICY "select_items" ON items FOR SELECT USING (true);

-- Allow authenticated users to insert a visitor record tied to their auth uid
CREATE POLICY "insert_visitors_authenticated" ON visitors
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to insert items only if the visitor belongs to them
CREATE POLICY "insert_items_authenticated" ON items
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM visitors v WHERE v.id = NEW.visitor_id AND v.user_id = auth.uid()));

-- Allow authenticated users to delete only their own items
CREATE POLICY "delete_own_items" ON items
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM visitors v WHERE v.id = OLD.visitor_id AND v.user_id = auth.uid()));

-- Note: in this model, visitors are linked to authenticated users (visitors.user_id = auth.uid()).
-- Frontend flow: sign in (magic link / social), then create a visitor record with user_id = auth.uid() and chosen name.
-- Items are then created referencing that visitor id; RLS ensures only the owner (authenticated user) can insert/delete items for their visitor.

-- IMPORTANT: After applying these policies, ensure clients authenticate before trying to create visitors or items.
-- You can keep 'select' open to public so public can view the wishlist without being authenticated.
