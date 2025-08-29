'use strict';

const DATA_URL = '/data/adherents.json';

// Auth UI
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userInfo = document.getElementById('userInfo');
const guard = document.getElementById('guard');
const app = document.getElementById('app');

function showAppIfAdmin(user){
  if(!user){ guard.style.display=''; app.style.display='none'; return; }
  const roles = (user.app_metadata && user.app_metadata.roles) || [];
  const isAdmin = roles.includes('admin');
  guard.style.display = isAdmin ? 'none' : '';
  app.style.display = isAdmin ? '' : 'none';
}
function updateAuthUI(user){
  if(user){
    loginBtn.style.display='none';
    logoutBtn.style.display='';
    userInfo.textContent = `${user.user_metadata?.full_name || user.email} (${(user.app_metadata?.roles||[]).join(', ')||'sans rôle'})`;
  } else {
    loginBtn.style.display='';
    logoutBtn.style.display='none';
    userInfo.textContent = '';
  }
  showAppIfAdmin(user);
}
loginBtn.addEventListener('click', ()=> window.netlifyIdentity?.open('login'));
logoutBtn.addEventListener('click', ()=> window.netlifyIdentity?.logout());
if(window.netlifyIdentity){
  window.netlifyIdentity.on('init', updateAuthUI);
  window.netlifyIdentity.on('login', u=>{ updateAuthUI(u); window.netlifyIdentity.close(); });
  window.netlifyIdentity.on('logout', ()=> updateAuthUI(null));
  window.netlifyIdentity.init();
}

// Données + filtre
let all = [], view = [];
const codeFilter = document.getElementById('codeFilter');
const applyFilterBtn = document.getElementById('applyFilter');
const resetFilter = document.getElementById('resetFilter');
const tbody = document.getElementById('membersBody');
const count = document.getElementById('count');

function escapeHtml(s){
  return String(s || '').replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
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
function applyFilterNow(){
  const q = (codeFilter.value||'').trim().toLowerCase();
  view = !q ? all : all.filter(m => String(m.code||'').toLowerCase().includes(q));
  render();
}
applyFilterBtn.addEventListener('click', applyFilterNow);
resetFilter.addEventListener('click', ()=>{ codeFilter.value=''; applyFilterNow(); });

fetch(DATA_URL)
  .then(r=>r.json())
  .then(data=>{ all = data.items||[]; view = all; render(); })
  .catch(err=>{ console.error(err); guard.style.display=''; guard.innerHTML='<p>Impossible de charger data/adherents.json</p>'; });

// Export CSV
document.getElementById('exportCsv').addEventListener('click', ()=>{
  const emails = view.map(m=>m.email).filter(Boolean);
  const csv = 'email\n'+emails.join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='emails.csv'; a.click(); URL.revokeObjectURL(url);
});

// Mailto
const mailtoBtn = document.getElementById('mailtoBtn');
const subjectInput = document.getElementById('subject');
mailtoBtn.addEventListener('click', ()=>{
  const emails = view.map(m=>m.email).filter(Boolean);
  const href = `mailto:${encodeURIComponent(emails.join(','))}?subject=${encodeURIComponent(subjectInput.value||'')}`;
  window.location.href = href;
});

// Envoi via Function
const sendEmailBtn = document.getElementById('sendEmailBtn');
const contentInput = document.getElementById('content');
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
