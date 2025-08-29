'use strict';

// On passe par la Function sécurisée (utilisateur connecté requis)
const DATA_URL = '/.netlify/functions/get-adherents';

const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userInfo = document.getElementById('userInfo');
const guard = document.getElementById('guard');
const app = document.getElementById('app');

function showAppIfLogged(user){
  guard.style.display = user ? 'none' : '';
  app.style.display = user ? '' : 'none';
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

loginBtn.addEventListener('click', ()=> window.netlifyIdentity?.open('login'));
logoutBtn.addEventListener('click', ()=> window.netlifyIdentity?.logout());

if(window.netlifyIdentity){
  window.netlifyIdentity.on('init', (u)=>{ updateAuthUI(u); if(u) loadMembers(); });
  window.netlifyIdentity.on('login', (u)=>{ updateAuthUI(u); window.netlifyIdentity.close(); loadMembers(); });
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
function applyFilterNow(){
  const q = (codeFilter.value||'').trim().toLowerCase();
  view = !q ? all : all.filter(m => String(m.code||'').toLowerCase().includes(q));
  render();
}
applyFilterBtn.addEventListener('click', applyFilterNow);
resetFilter.addEventListener('click', ()=>{ codeFilter.value=''; applyFilterNow(); });

async function loadMembers(){
  try{
    const user = window.netlifyIdentity?.currentUser();
    if(!user) throw new Error('Non connecté');
    const token = await user.jwt();
    const res = await fetch(DATA_URL, { headers: { Authorization: `Bearer ${token}` } });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    all = data.items || [];
    view = all;
    render();
  }catch(e){
    console.error(e);
    guard.style.display='';
    guard.innerHTML = '<p>Connectez-vous pour voir la liste.</p>';
  }
}

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
