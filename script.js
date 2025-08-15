// année
document.getElementById('annee').textContent = new Date().getFullYear();

// utilitaires
async function getJSON(path){ const r = await fetch(path); if(!r.ok) throw new Error(path); return r.json(); }
async function getText(path){ const r = await fetch(path); if(!r.ok) throw new Error(path); return r.text(); }

// Rendu bureau (members.json avec structure {items: [...] })
(async function renderMembers(){
  try{
    const data = await getJSON('data/members.json');
    const items = Array.isArray(data) ? data : (data.items || []);
    const wrap = document.getElementById('members');
    wrap.innerHTML = items.map(m => `
      <article class="card">
        <h3>${m.nom}</h3>
        <div class="meta">${m.poste || ''}</div>
        <div>${m.telephone ? `📞 ${m.telephone}`: ''}</div>
        <div>${m.email ? `✉️ <a href="mailto:${m.email}">${m.email}</a>`: ''}</div>
      </article>
    `).join('');
  }catch(e){ console.error(e); }
})();

// Rendu infos pratiques (Markdown simplifié -> HTML basique)
(async function renderPratiques(){
  try{
    const md = await getText('data/pratiques.md');
    const html = md
      .replace(/^### (.*$)/gim,'<h3>$1</h3>')
      .replace(/^## (.*$)/gim,'<h2>$1</h2>')
      .replace(/^# (.*$)/gim,'<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim,'<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim,'<em>$1</em>')
      .replace(/^- (.*$)/gim,'<li>$1</li>')
      .replace(/\n\n/g,'</p><p>')
      .replace(/<li>/g,'<ul><li>').replace(/<\/li>/g,'</li></ul>');
    document.getElementById('pratiques-content').innerHTML = `<p>${html}</p>`;
  }catch(e){ console.error(e); }
})();

// ---- Google Calendar embedded controls ----
const gcal = document.getElementById('gcal');
const icalLink = document.getElementById('ical-link');

// valeurs pour USCC (embed fourni)
const GCAL_BASE = "https://calendar.google.com/calendar/embed";
const CAL_SRC = encodeURIComponent("lespelousdeveyettes35@gmail.com");
const CTZ = "Europe/Paris";
const ICAL_URL = ""; // Ajoutez ici l'URL iCal public si disponible

function buildSrc(view="MONTH"){
  const params = new URLSearchParams({
    src: CAL_SRC,
    ctz: CTZ,
    mode: view,
    showTitle: "0",
    showNav: "1",
    showPrint: "0",
    showTabs: "1",
    showCalendars: "0",
    showTz: "0"
  });
  return `${GCAL_BASE}?${params.toString()}`;
}

if (gcal) gcal.src = buildSrc("MONTH");
if (icalLink){
  if (ICAL_URL){
    icalLink.href = ICAL_URL;
    icalLink.style.display = 'inline-block';
  } else {
    icalLink.style.display = 'none';
  }
}

document.querySelectorAll('.agenda-controls [data-view]').forEach(btn=>{
  btn.addEventListener('click', ()=>{ gcal.src = buildSrc(btn.dataset.view); });
});
