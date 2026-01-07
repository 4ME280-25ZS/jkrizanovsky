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
