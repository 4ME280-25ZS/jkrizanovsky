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

// --- Remove registration flow; implement per-item assignment using Supabase when enabled ---

const PRESET_TITLES = [
  'Lamborghini',
  'Ferrari',
  'Head & Shoulders sprcháč',
  'angličák traktoru',
  'zlatý pohár',
  'příbory'
];

async function loadItems(){
  try {
    if (SUPABASE_ENABLED) {
      // ensure seed items exist
      const { data: existing, error: e1 } = await supabaseClient.from('items').select('id,title');
      if (e1) throw e1;
      const existingTitles = new Set((existing||[]).map(r=>r.title));
      const toInsert = PRESET_TITLES.filter(t=>!existingTitles.has(t)).map(t=>({ title: t }));
      if (toInsert.length) {
        const { error: insErr } = await supabaseClient.from('items').insert(toInsert);
        if (insErr) console.warn('Seed insert error:', insErr.message || insErr);
      }
      // read items with visitor names via view
      const { data, error } = await supabaseClient.from('items_view').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      renderItems(data || []);
      return;
    }

    // fallback: local server
    const items = await api('/api/items');
    renderItems(items);
  } catch (err) {
    console.error(err);
    // show preview sample items
    enterPreviewMode();
    renderItems(SAMPLE_ITEMS.concat(PRESET_TITLES.filter(t=>!SAMPLE_ITEMS.find(s=>s.title===t)).map((t,i)=>({ id: 100+i, title: t, visitor_id: 0, visitor_name: null }))));
  }
}

function renderItems(items){
  itemsList.innerHTML = '';
  if (!items.length) itemsList.innerHTML = '<li class="muted">Zatím žádné položky</li>';
  items.forEach(it => {
    const li = document.createElement('li');
    const assigned = it.visitor_name && it.visitor_name.trim();
    const titleHtml = `<div><strong>${escapeHtml(it.title)}</strong>` + (assigned?`<div class="meta">od ${escapeHtml(it.visitor_name)}</div>`:'') + '</div>';

    li.innerHTML = titleHtml;

    if (!assigned) {
      const input = document.createElement('input');
      input.placeholder = 'Zadej své jméno';
      input.style.marginRight = '.6rem';
      const btn = document.createElement('button');
      btn.textContent = 'Potvrdit';
      btn.addEventListener('click', async ()=>{
        const name = (input.value || '').trim();
        if (!name) return alert('Napiš jméno');
        try {
          if (SUPABASE_ENABLED) {
            // create visitor and assign
            const { data: v, error: e1 } = await supabaseClient.from('visitors').insert({ name }).select().single();
            if (e1) throw e1;
            const { data: updated, error: e2 } = await supabaseClient.from('items').update({ visitor_id: v.id }).eq('id', it.id).select().single();
            if (e2) throw e2;
            await loadItems();
            return;
          }

          // fallback: call local API (server must implement assignment route)
          await api(`/api/items/${it.id}/assign`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name }) });
          await loadItems();
        } catch (err) { alert(err.message || err); }
      });
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.gap = '.6rem';
      wrapper.appendChild(input);
      wrapper.appendChild(btn);
      li.appendChild(wrapper);
    }

    itemsList.appendChild(li);
  });
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