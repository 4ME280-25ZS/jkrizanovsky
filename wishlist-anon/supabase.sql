-- Supabase schema for wishlist-anon (anonymous tokens, no timestamps)

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Visitors table with anonymous token
CREATE TABLE IF NOT EXISTS visitors (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  UNIQUE (token)
);

-- Items table: fixed list of items; visitor_id NULL when unassigned
CREATE TABLE IF NOT EXISTS items (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  visitor_id BIGINT REFERENCES visitors(id),
  CONSTRAINT unique_visitor_item UNIQUE(visitor_id)
);

-- Simple view to join visitor name
CREATE OR REPLACE VIEW items_view AS
SELECT i.id, i.title, i.visitor_id, v.name AS visitor_name
FROM items i LEFT JOIN visitors v ON i.visitor_id = v.id
ORDER BY i.id;

-- Seed function to insert preset items if missing
CREATE OR REPLACE FUNCTION seed_items_if_missing() RETURNS void AS $$
BEGIN
  INSERT INTO items (title)
  SELECT t FROM (VALUES
    ('Lamborghini'),
    ('Ferrari'),
    ('Head & Shoulders sprcháč'),
    ('angličák traktoru'),
    ('zlatý pohár'),
    ('příbory')
  ) AS v(t)
  WHERE NOT EXISTS (SELECT 1 FROM items WHERE title = v.t);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- assign_item: creates or finds visitor by token (if given), enforces visitor has at most one item,
-- and atomically assigns item if unassigned. Returns visitor id and token.
CREATE OR REPLACE FUNCTION assign_item(_item_id integer, _name text, _token uuid DEFAULT NULL)
RETURNS TABLE(visitor_id bigint, visitor_token uuid) AS $$
DECLARE
  v_id bigint;
  v_token uuid := _token;
BEGIN
  -- find or create visitor
  IF v_token IS NULL THEN
    v_token := gen_random_uuid();
    INSERT INTO visitors (name, token) VALUES (_name, v_token) RETURNING id INTO v_id;
  ELSE
    SELECT id INTO v_id FROM visitors WHERE token = v_token;
    IF v_id IS NULL THEN
      INSERT INTO visitors (name, token) VALUES (_name, v_token) RETURNING id INTO v_id;
    END IF;
  END IF;

  -- ensure visitor has no item already
  IF EXISTS (SELECT 1 FROM items WHERE visitor_id = v_id) THEN
    RAISE EXCEPTION 'visitor_already_has_item';
  END IF;

  -- try to assign item if unassigned
  UPDATE items SET visitor_id = v_id WHERE id = _item_id AND visitor_id IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'item_already_assigned';
  END IF;

  visitor_id := v_id;
  visitor_token := v_token;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- unassign_item: verifies token matches the owner and unassigns
CREATE OR REPLACE FUNCTION unassign_item(_item_id integer, _token uuid)
RETURNS boolean AS $$
DECLARE
  v_id bigint;
  current_owner bigint;
BEGIN
  SELECT id INTO v_id FROM visitors WHERE token = _token;
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'visitor_not_found';
  END IF;

  SELECT visitor_id INTO current_owner FROM items WHERE id = _item_id;
  IF current_owner IS NULL THEN
    RAISE EXCEPTION 'item_unassigned';
  END IF;

  IF current_owner != v_id THEN
    RAISE EXCEPTION 'not_owner';
  END IF;

  UPDATE items SET visitor_id = NULL WHERE id = _item_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
