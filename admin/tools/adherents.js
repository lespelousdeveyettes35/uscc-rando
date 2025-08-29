'use strict';

// Function sécurisée (utilisateur connecté requis)
const DATA_URL = '/.netlify/functions/get-adherents';

// --- DOM
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userInfo = document.getElementById('userInfo');
const guard = document.getElementById('guard');
const app = document.getElementById('app');

// --- UI
function showAppIfLogged(user){
  if (guard) guard.style.display = user ? 'none' : '';
  if (app)   app.style.display   = user ? '' : 'none';
}
function updateAuthUI(user){
  if(user){
    loginBtn.style.display='none';
    logoutBtn.style.display='';
    userInfo.textContent = user.user_metadata?.full_name || user.email || '';
  } else {
    loginBtn.style.display='';
    logoutBtn.style.display='none';
    userInfo.textContent = '';
  }
  showAppIfLogged(user);
}

// Ouverture/fermeture
loginBtn.addEventListener('click', () => window.netlifyIdentity?.open('login'));
logoutBtn.addEventListener('click', () => window.netlifyIdentity?.logout());

// --- Identity : branche les handlers PUIS init (une seule fois) ---
if (window.netlifyIdentity) {
  window.netlifyIdentity.on('init',  (u) => { updateAuthUI(u); if (u) loadMembers(); });
  window.netlifyIdentity.on('login', (u) => { updateAuthUI(u); window.netlifyIdentity.close(); loadMembers(); });
  window.netlifyIdentity.on('logout',      () => { updateAuthUI(null); });

  // Forcer l'URL Identity (important en iframe CMS)
  window.netlifyIdentity.init({ APIUrl: `${window.location.origin}/.netlify/identity` });
}

// --- Données + filtre
let all = [], view = [];
const codeFilter     = document.getElementById('codeFilter');
const applyFilterBtn = document.getElementById('applyFilter');
const resetFilter    = document.getElementById('resetFilter');
const tbody          = document.getElementById('membersBody');
const count          = document.getElementById('count');

function escapeHtml(s){
  return String(s || '').replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}
function render(){
  tbody.innerHTML='';
  for(const m of view){
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(m.nom)}</td><td>${escapeHtml(m.email)}</td><td>${escapeHtml(m.code)}</td>`;
    tbody.appendChild(tr);
  }
  count.textContent = `${view.length} adhérent(s)`;
}

// (option: filtrer côté client)
// function applyFilterNow(){
//   const q = (codeFilter.value||'').trim().toLowerCase();
//   view = !q ? all : all.filter(m => String(m.code||'').toLowerCase().includes(q));
//   render();
// }

// (mieux: filtrer côté serveur → évite d’exposer toute la liste dans le JS)
async function applyFilterNow(){
  await loadMembers(codeFilter.value || '');
}

applyFilterBtn.addEventListener('click', applyFilterNow);
resetFilter.addEventListener('click', async () => { codeFilter.value=''; await applyFilterNow(); });

// Charge la liste (optionnellement filtrée) depuis la Function (GET + JWT)
async function loadMembers(code=''){
  try{
    const user = window.netlifyIdentity?.currentUser();
    if(!user) throw new Error('Non connecté');
    const token = await user.jwt();

    const url = new URL(DATA_URL, window.location.origin);
    if (code && code.trim()) url.searchParams.set('code', code.trim());

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-store' }
    });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    all = data.items || [];
    view = all;
    render();
  }catch(e){
    console.error(e);
    if (guard){
      guard.style.display='';
      guard.innerHTML = '<p>Connectez-vous pour voir la liste.</p>';
    }
  }
}

// --- Export CSV
document.getElementById('exportCsv').addEventListener('click', ()=>{
  const emails = view.map(m=>m.email).filter(Boolean);
  const csv = 'email\n'+emails.join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='emails.csv'; a.click(); URL.revokeObjectURL(url);
});

// --- Mailto
const mailtoBtn   = document.getElementById('mailtoBtn');
const subjectInput= document.getElementById('subject');
mailtoBtn.addEventListener('click', ()=>{
  const emails = view.map(m=>m.email).filter(Boolean);
  const href = `mailto:${encodeURIComponent(emails.join(','))}?subject=${encodeURIComponent(subjectInput.value||'')}`;
  window.location.href = href;
});

// --- Envoi via Function
const sendEmailBtn   = document.getElementById('sendEmailBtn');
const contentInput   = document.getElementById('content');
const fromEmailInput = document.getElementById('fromEmail');

sendEmailBtn.addEventListener('click', async ()=>{
  sendEmailBtn.disabled = true;
  try{
    const user = window.netlifyIdentity?.currentUser();
    if(!user){ alert('Connectez-vous.'); return; }
    const token = await user.jwt();
    const emails = view.map(m=>m.email).filter(Boolean);
    if(!emails.length){ alert('Aucun destinataire.'); return; }
    const res = await fetch('/.netlify/functions/send-email', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
      body: JSON.stringify({
        to: emails,
        subject: subjectInput.value || '(sans objet)',
        content: contentInput.value || '',
        from: fromEmailInput.value || undefined
      })
    });
    const data = await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(data.error||'Échec envoi');
    alert(`Email envoyé à ${emails.length} destinataire(s).`);
  }catch(e){ alert('Erreur: '+e.message); }
  finally{ sendEmailBtn.disabled=false; }
});
