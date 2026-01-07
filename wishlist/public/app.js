// This file supports two backends:
// 1) local server API (default, same as before)
// 2) Supabase (if you create `public/supabase-config.js` from `supabase-config.example.js`)

let SUPABASE_ENABLED = false;
let supabaseClient = null;

if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY && window.supabase) {
  SUPABASE_ENABLED = true;
  supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
}

async function api(path, options) {
  if (!SUPABASE_ENABLED) {
    const res = await fetch(path, options);
    if (!res.ok) {
      const err = await res.json().catch(()=>({error:res.statusText}));
      throw new Error(err.error || res.statusText);
    }
    return res.json();
  }

  // Supabase-backed implementation
  if (path === '/api/items' && (!options || (options && options.method === 'GET'))) {
    const { data, error } = await supabaseClient.from('items_view').select('*');
    if (error) throw new Error(error.message);
    return data;
  }

  if (path === '/api/visitors' && options && options.method === 'POST') {
    const body = JSON.parse(options.body);
    const { data, error } = await supabaseClient.from('visitors').insert([{ name: body.name }]).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  if (path === '/api/visitors' && (!options || (options && options.method === 'GET'))) {
    const { data, error } = await supabaseClient.from('visitors').select('*');
    if (error) throw new Error(error.message);
    return data;
  }

  if (path === '/api/items' && options && options.method === 'POST') {
    const body = JSON.parse(options.body);
    const { data, error } = await supabaseClient.from('items').insert([{ title: body.title, visitor_id: body.visitor_id }]).select().single();
    if (error) throw new Error(error.message);
    // return item joined with visitor name
    const { data: itemView, error: viewErr } = await supabaseClient.from('items_view').select('*').eq('id', data.id).single();
    if (viewErr) throw new Error(viewErr.message);
    return itemView;
  }

  if (path.startsWith('/api/items/') && options && options.method === 'DELETE') {
    // options.body should contain visitor_id
    const id = Number(path.split('/').pop());
    const body = JSON.parse(options.body);
    // delete where id and visitor_id match
    const { data, error } = await supabaseClient.from('items').delete().match({ id, visitor_id: body.visitor_id }).select().single();
    if (error) throw new Error(error.message);
    return { success: true };
  }

  throw new Error('Unsupported API path for Supabase: ' + path);
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
          await api('/api/items/' + it.id, { method: 'DELETE', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ visitor_id: visitor.id }) });
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