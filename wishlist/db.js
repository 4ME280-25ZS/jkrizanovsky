// REMOVED: wishlist database helper removed.


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