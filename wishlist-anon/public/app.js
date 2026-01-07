// Client for wishlist-anon (Option A: anonymous token stored locally)
if (typeof SUPABASE_ENABLED === 'undefined') var SUPABASE_ENABLED = false;
if (SUPABASE_ENABLED && typeof supabaseClient === 'undefined') {
  console.warn('SUPABASE_ENABLED is true but supabaseClient not found — disabling Supabase features.');
  SUPABASE_ENABLED = false;
}

const TOKEN_KEY = 'wishlist_anon_token';
let localVisitor = JSON.parse(localStorage.getItem('wishlist_anon_visitor') || 'null');
const banner = document.getElementById('banner');
const itemsList = document.getElementById('itemsList');

function showBanner(msg){ if (!banner) return; banner.classList.remove('hidden'); banner.textContent = msg; }
function hideBanner(){ if (!banner) return; banner.classList.add('hidden'); banner.textContent = ''; }

async function seedAndLoad(){
  try {
    if (!SUPABASE_ENABLED) throw new Error('Supabase not configured');
    await supabaseClient.rpc('seed_items_if_missing');
    await loadItems();
  } catch (err) {
    showBanner('Chyba DB: ' + (err.message || err));
    itemsList.innerHTML = '<li class="muted">Nelze se připojit k databázi. Zkontrolujte konfiguraci.</li>';
  }
}

async function loadItems(){
  const { data, error } = await supabaseClient.from('items_view').select('*').order('id', { ascending: true });
  if (error) return showBanner('Chyba načítání: '+error.message);
  renderItems(data || []);
}

// 8-bit style icons mapping
const itemIcons = {
  'Lamborghini': '🏎️',
  'Ferrari': '🏁',
  'Head & Shoulders sprcháč': '🧴',
  'angličák traktoru': '🔧',
  'zlatý pohár': '🏆',
  'příbory': '🍴'
};

function renderItems(items){
  itemsList.innerHTML = '';
  if (!items.length) { itemsList.innerHTML = '<li class="muted">Žádné položky</li>'; return; }
  items.forEach(it => {
    const li = document.createElement('li');
    li.className = 'item-card';

    const icon = document.createElement('div');
    icon.className = 'icon';
    icon.textContent = itemIcons[it.title] || '📦';
    li.appendChild(icon);

    const titleDiv = document.createElement('div');
    titleDiv.className = 'title';
    titleDiv.textContent = it.title;
    li.appendChild(titleDiv);

    const assigned = it.visitor_name;
    if (assigned) {
      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = 'od ' + it.visitor_name;
      li.appendChild(meta);
      // show unassign if this visitor is local owner
      if (localVisitor && localVisitor.id && localVisitor.id === it.visitor_id) {
        const controls = document.createElement('div');
        controls.className = 'controls';
        const btn = document.createElement('button');
        btn.textContent = 'Odebrat';
        btn.addEventListener('click', async ()=>{
          try {
            const token = localStorage.getItem(TOKEN_KEY);
            const { data, error } = await supabaseClient.rpc('unassign_item', { _item_id: it.id, _token: token });
            if (error) throw error;
            await loadItems();
          } catch (err) { alert('Nelze odebrat: '+(err.message||err)); }
        });
        controls.appendChild(btn);
        li.appendChild(controls);
      }
    } else {
      const controls = document.createElement('div');
      controls.className = 'controls';
      const input = document.createElement('input');
      input.placeholder = 'Zadej své jméno';
      const btn = document.createElement('button');
      btn.textContent = 'Potvrdit';
      btn.addEventListener('click', async ()=>{
        const name = (input.value || '').trim();
        if (!name) return alert('Zadejte jméno');
        try {
          const token = localStorage.getItem(TOKEN_KEY) || null;
          const { data, error } = await supabaseClient.rpc('assign_item', { _item_id: it.id, _name: name, _token: token });
          if (error) throw error;
          // data is an array of rows from RETURNS TABLE — extract visitor_id and visitor_token
          const res = data && data[0];
          if (res) {
            localStorage.setItem(TOKEN_KEY, res.visitor_token);
            localStorage.setItem('wishlist_anon_visitor', JSON.stringify({ id: res.visitor_id }));
            localVisitor = { id: res.visitor_id };
          }
          await loadItems();
        } catch (err) { alert('Nelze přiřadit: '+(err.message||err)); }
      });
      controls.appendChild(input);
      controls.appendChild(btn);
      li.appendChild(controls);
    }

    itemsList.appendChild(li);
  });
}

(async function init(){
  if (!SUPABASE_ENABLED) { showBanner('Supabase není nakonfigurováno — povolte SUPABASE_URL a SUPABASE_ANON_KEY v deploy secrets.'); return; }
  hideBanner();
  // try to parse local visitor id if exists
  try { localVisitor = JSON.parse(localStorage.getItem('wishlist_anon_visitor') || 'null'); } catch(e){ localVisitor = null; }
  await seedAndLoad();
})();