const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'wishlist.db');
const db = new sqlite3.Database(dbPath);

// initialize tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS visitors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    visitor_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(visitor_id) REFERENCES visitors(id)
  )`);
});

module.exports = {
  getItems() {
    return new Promise((resolve, reject) => {
      db.all(`SELECT items.id, items.title, items.visitor_id, visitors.name as visitor_name, items.created_at
              FROM items JOIN visitors ON items.visitor_id = visitors.id
              ORDER BY items.created_at DESC`, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  },

  getVisitors() {
    return new Promise((resolve, reject) => {
      db.all(`SELECT id, name, created_at FROM visitors ORDER BY created_at DESC`, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  },

  createVisitor(name) {
    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO visitors (name) VALUES (?)`, [name], function (err) {
        if (err) return reject(err);
        resolve(this.lastID);
      });
    });
  },

  getVisitorById(id) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT id, name, created_at FROM visitors WHERE id = ?`, [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  },

  createItem(title, visitor_id) {
    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO items (title, visitor_id) VALUES (?, ?)`, [title, visitor_id], function (err) {
        if (err) return reject(err);
        resolve(this.lastID);
      });
    });
  },

  getItemByVisitor(visitor_id) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT id, title, visitor_id, created_at FROM items WHERE visitor_id = ?`, [visitor_id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  },

  getItemById(id) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT items.id, items.title, items.visitor_id, visitors.name as visitor_name, items.created_at
              FROM items JOIN visitors ON items.visitor_id = visitors.id
              WHERE items.id = ?`, [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  },

  deleteItem(id) {
    return new Promise((resolve, reject) => {
      db.run(`DELETE FROM items WHERE id = ?`, [id], function (err) {
        if (err) return reject(err);
        resolve(true);
      });
    });
  }
};