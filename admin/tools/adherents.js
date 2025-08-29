const DATA_URL = '/.netlify/functions/get-adherents';

function showAppIfLogged(user){
  guard.style.display = user ? 'none' : '';
  app.style.display = user ? '' : 'none';
}
function updateAuthUI(user){
  if(user){
    loginBtn.style.display='none';
    logoutBtn.style.display='';
    userInfo.textContent = user.user_metadata?.full_name || user.email;
  } else {
    loginBtn.style.display='';
    logoutBtn.style.display='none';
    userInfo.textContent = '';
  }
  showAppIfLogged(user);
}

async function loadMembers(){
  try{
    const user = window.netlifyIdentity?.currentUser();
    if(!user){ throw new Error('Non connecté'); }
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
// après netlifyIdentity.init(), appelle loadMembers()
netlifyIdentity.on('login', u=>{ updateAuthUI(u); netlifyIdentity.close(); loadMembers(); });
netlifyIdentity.on('init',  u=>{ updateAuthUI(u); if(u) loadMembers(); });
