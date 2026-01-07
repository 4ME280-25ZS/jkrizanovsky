async function api(path, options) {
  const res = await fetch(path, options);
  if (!res.ok) {
    const err = await res.json().catch(()=>({error:res.statusText}));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

const visitorKey = 'wishlist_visitor';
let visitor = JSON.parse(localStorage.getItem(visitorKey) || 'null');

const visitorNameInput = document.getElementById('visitorName');
const registerBtn = document.getElementById('registerBtn');
const addArea = document.getElementById('addArea');
const itemTitleInput = document.getElementById('itemTitle');
const addBtn = document.getElementById('addBtn');
const yourItem = document.getElementById('yourItem');
const itemsList = document.getElementById('itemsList');

registerBtn.addEventListener('click', async () => {
  const name = visitorNameInput.value.trim();
  if (!name) return alert('Zadej jméno');
  try {
    const v = await api('/api/visitors', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({name}) });
    visitor = v;
    localStorage.setItem(visitorKey, JSON.stringify(visitor));
    renderState();
  } catch (err) { alert(err.message); }
});

addBtn.addEventListener('click', async () => {
  const title = itemTitleInput.value.trim();
  if (!title) return alert('Napiš položku');
  try {
    await api('/api/items', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ title, visitor_id: visitor.id }) });
    itemTitleInput.value = '';
    await loadItems();
    renderState();
  } catch (err) { alert(err.message); }
});

async function loadItems(){
  try {
    const items = await api('/api/items');
    renderItems(items);
  } catch (err) { console.error(err); }
}

function renderItems(items){
  itemsList.innerHTML = '';
  if (!items.length) itemsList.innerHTML = '<li class="muted">Zatím žádné položky</li>';
  items.forEach(it => {
    const li = document.createElement('li');
    li.innerHTML = `<div><strong>${escapeHtml(it.title)}</strong><div class="meta">od ${escapeHtml(it.visitor_name)}</div></div>`;
    if (visitor && visitor.id === it.visitor_id) {
      const btn = document.createElement('button');
      btn.textContent = 'Odebrat';
      btn.addEventListener('click', async ()=>{
        if (!confirm('Opravdu chcete položku odstranit?')) return;
        try {
          await fetch('/api/items/' + it.id, { method: 'DELETE', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ visitor_id: visitor.id }) });
          await loadItems();
          renderState();
        } catch (err) { alert(err.message); }
      });
      li.appendChild(btn);
    }
    itemsList.appendChild(li);
  });
}

function escapeHtml(s){ return (s+'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]); }

function renderState(){
  if (visitor) {
    document.getElementById('visitorName').value = visitor.name;
    addArea.classList.toggle('hidden', false);
    yourItem.textContent = 'Registrován jako ' + visitor.name;
  } else {
    addArea.classList.add('hidden');
    yourItem.textContent = 'Nejsi zaregistrován nebo už máš položku.';
  }
}

(async function init(){
  await loadItems();
  renderState();
  // check if visitor has item - if so hide add area
  if (visitor) {
    try {
      const items = await api('/api/items');
      const mine = items.find(i=>i.visitor_id === visitor.id);
      if (mine) addArea.classList.add('hidden');
    } catch (err) { console.error(err); }
  }
})();