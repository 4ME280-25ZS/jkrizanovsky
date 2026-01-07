// API wrapper: uses local server; if server is not reachable, items GET returns sample data for preview
const SAMPLE_ITEMS = [{ id: 1, title: 'Ukázková položka', visitor_id: 0, visitor_name: 'Ukázkový návštěvník' }];

// Supabase client demo toggles
// A generated `supabase-config.js` (produced by CI) should set `window.SUPABASE_ENABLED = true`
// and create `window.supabaseClient`. Ensure these globals exist to avoid runtime errors.
if (typeof SUPABASE_ENABLED === 'undefined') var SUPABASE_ENABLED = false;
if (SUPABASE_ENABLED && typeof supabaseClient === 'undefined') {
  console.warn('SUPABASE_ENABLED is true but supabaseClient not found — disabling Supabase features.');
  SUPABASE_ENABLED = false;
}

function enterPreviewMode(){
  window.__WISHLIST_PREVIEW = true;
  const banner = document.getElementById('previewBanner');
  if (banner) banner.classList.remove('hidden');
  if (registerBtn) registerBtn.disabled = true;
  if (addBtn) addBtn.disabled = true;
  if (visitorNameInput) visitorNameInput.disabled = true;
  if (itemTitleInput) itemTitleInput.disabled = true;
}

async function api(path, options) {
  try {
    const res = await fetch(path, options);
    if (!res.ok) {
      const err = await res.json().catch(()=>({error:res.statusText}));
      throw new Error(err.error || res.statusText);
    }
    return res.json();
  } catch (err) {
    // if this is a GET for items, gracefully show sample data in preview mode
    if (!options || (options && (!options.method || options.method === 'GET')) && path === '/api/items') {
      enterPreviewMode();
      return SAMPLE_ITEMS;
    }
    throw err;
  }
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

// Auth & visitor registration
const authEmailInput = document.getElementById('authEmail');
const authSendBtn = document.getElementById('authSendBtn');
const authSignOutBtn = document.getElementById('authSignOutBtn');

let authUser = null;

if (SUPABASE_ENABLED) {
  // handle magic link sign-in
  authSendBtn.addEventListener('click', async () => {
    const email = authEmailInput.value.trim();
    if (!email) return alert('Zadej e-mail');
    try {
      const { error } = await supabaseClient.auth.signInWithOtp({ email });
      if (error) throw error;
      alert('Odkaz pro přihlášení byl odeslán na e-mail. Dokonči přihlášení přes mail.');
    } catch (err) { alert(err.message); }
  });

  authSignOutBtn.addEventListener('click', async ()=>{
    await supabaseClient.auth.signOut();
    authUser = null;
    renderAuthState();
  });

  // listen for auth state changes
  supabaseClient.auth.onAuthStateChange((event, session) => {
    authUser = session?.user ?? null;
    renderAuthState();
  });
}

registerBtn.addEventListener('click', async () => {
  const name = visitorNameInput.value.trim();
  if (!name) return alert('Zadej jméno');
  try {
    // If Supabase enabled and user is authenticated, create visitor with user_id
    if (SUPABASE_ENABLED && authUser) {
      const v = await api('/api/visitors', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name, user_id: authUser.id }) });
      visitor = v;
      localStorage.setItem(visitorKey, JSON.stringify(visitor));
      renderState();
      return;
    }

    // Fallback: previous behavior (local server)
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

function renderAuthState(){
  if (!SUPABASE_ENABLED) return;
  const signedIn = !!authUser;
  authSendBtn.classList.toggle('hidden', signedIn);
  authSignOutBtn.classList.toggle('hidden', !signedIn);
  if (signedIn) {
    document.getElementById('authEmail').value = authUser.email ?? '';
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