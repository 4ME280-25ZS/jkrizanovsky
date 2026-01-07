// REMOVED: wishlist server has been removed from the repository.


app.get('/api/visitors', async (req, res) => {
  try {
    const visitors = await db.getVisitors();
    res.json(visitors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/visitors', async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  try {
    const id = await db.createVisitor(name.trim());
    const visitor = await db.getVisitorById(id);
    res.status(201).json(visitor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/items', async (req, res) => {
  const { title, visitor_id } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
  if (!visitor_id) return res.status(400).json({ error: 'visitor_id is required' });

  try {
    const visitor = await db.getVisitorById(visitor_id);
    if (!visitor) return res.status(404).json({ error: 'Visitor not found' });

    const existing = await db.getItemByVisitor(visitor_id);
    if (existing) return res.status(409).json({ error: 'Visitor already has an item' });

    const id = await db.createItem(title.trim(), visitor_id);
    const item = await db.getItemById(id);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// delete an item (only owner can delete) - visitor_id must match
app.delete('/api/items/:id', async (req, res) => {
  const itemId = Number(req.params.id);
  const { visitor_id } = req.body;
  if (!visitor_id) return res.status(400).json({ error: 'visitor_id is required in body' });

  try {
    const item = await db.getItemById(itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.visitor_id !== visitor_id) return res.status(403).json({ error: 'Not allowed' });

    await db.deleteItem(itemId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// fallback to index
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Wishlist server listening on http://localhost:${PORT}`);
});