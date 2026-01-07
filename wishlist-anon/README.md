Wishlist (anonymous)
=====================

This is an anonymous (no-login) wishlist that stores assignments in a Supabase Postgres DB. Each visitor can sign up to *one* item at a time. The system uses short DB RPCs to enforce the rule server-side.

Quick setup
-----------
1. In Supabase SQL editor run `wishlist-anon/supabase.sql` to create tables, view and RPCs.
2. Add repository Secrets in GitHub: `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
3. For local testing copy `public/supabase-config.example.js` → `public/supabase-config.js` and fill values (do NOT commit).
4. Deploy: push to `main`. The deploy workflow will generate `public/supabase-config.js` from GitHub Secrets and publish `wishlist-anon/public` to `gh-pages/wishlist-anon`.

Notes
-----
- No timestamps or audit logs are stored (per your request).
- Visitors are tracked by a generated UUID token stored in localStorage; the token is required to unassign your item.
