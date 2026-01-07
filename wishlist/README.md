# Wishlist subproject

Simple wishlist where each visitor can register with a name and add exactly one item. Items are stored in a local SQLite DB (file `wishlist.db`).

Features:
- Visitors create their identity by entering a name
- Each visitor can add one item and later delete it
- Items are shown with the visitor's name

Run locally

1. Install dependencies:

   npm install

2. Start server:

   npm start

3. Open http://localhost:3000

Notes

- The server stores data in `wishlist/wishlist.db` (SQLite). Keep in mind this is a simple demo and not hardened for production.
- To deploy this project you'll need a Node.js host (Render, Fly, Heroku, Vercel serverless functions etc.) or adapt the storage to a managed DB.

GitHub Pages & preview mode

- This repository already has a GitHub Pages deployment workflow that publishes the repository root to `gh-pages` branch. The wishlist is accessible on the published site at:

  `https://<your-username>.github.io/<repo>/wishlist/`

  (the `wishlist/index.html` file redirects to `wishlist/public/` so the page is accessible immediately after Pages publishes the repo.)

- A preview mode is built into the frontend: if no backend (local server or Supabase) responds when loading items, the page will show a small banner and example items so you can inspect the UI without any database.

Using Supabase (optional)

1. Create a new project at https://app.supabase.com.
2. Open the SQL editor and run `wishlist/supabase.sql` from this repo to create the schema and `items_view`.
3. Copy `wishlist/public/supabase-config.example.js` to `wishlist/public/supabase-config.js` and fill in your `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
   - Note: public anon key is used by the frontend in this demo. For production, enable Row Level Security and add appropriate policies.
4. After adding `supabase-config.js` (it's ignored by `.gitignore`), the frontend will use Supabase directly for listing/creating/deleting items.

Deploy wishlist only (optional)

- If you prefer to publish **only** the static `wishlist/public` into a dedicated `gh-pages` subfolder, there's an optional workflow ` .github/workflows/deploy-wishlist.yml` that copies `wishlist/public` into `gh-pages` under `wishlist/` so the page is available at the same URL above. See the workflow file and enable Actions if you want this automatic behavior.
