// ---- année dans le footer
document.getElementById('annee').textContent = new Date().getFullYear();

// ---- helpers fetch
async function getJSON(path){ const r = await fetch(path); if(!r.ok) throw new Error(path); return r.json(); }
async function getText(path){ const r = await fetch(path); if(!r.ok) throw new Error(path); return r.text(); }

// ---- Rendu BUREAU (members.json peut être {items:[...]} ou un tableau)
(async function renderMembers(){
  try{
    const data = await getJSON('data/members.json');
    const items = Array.isArray(data) ? data : (data.items || []);
    const wrap = document.getElementById('members');

    const html = items.map(m => {
      const nom = m.nom || '';
      const photo = (m.photo || '').trim();
      const useInitials = !photo || /placeholder\.(png|jpe?g|webp)$/i.test(photo);
      const src = useInitials ? initialsAvatar(nom) : photo;

      return `
        <article class="card">
          <img
            src="${src}"
            data-name="${nom.replace(/"/g, '&quot;')}"
            alt="${nom ? `Portrait de ${nom}` : 'Photo non disponible'}"
            style="width:100%;max-width:160px;border-radius:8px;margin-bottom:8px;aspect-ratio:1/1;object-fit:cover">
          <h3>${nom || ''}</h3>
          <div class="meta">${m.poste || ''}</div>
          ${m.telephone ? `<div>📞 ${m.telephone}</div>` : ''}
          ${m.email ? `<div>✉️ <a href="mailto:${m.email}">${m.email}</a></div>` : ''}
        </article>
      `;
    }).join('');

    wrap.innerHTML = html || '<p>Aucun membre renseigné pour le moment.</p>';

    // Fallback si une image "valide" casse au chargement (404, etc.)
    wrap.querySelectorAll('img[data-name]').forEach(img => {
      img.addEventListener('error', () => {
        const name = img.dataset.name || '';
        img.src = initialsAvatar(name);
      });
    });
  }catch(e){
    console.error(e);
  }
})();

// --- helpers avatar initiales ---
function initialsFromName(name){
  const initials = String(name).trim().split(/\s+/).map(p => p[0]).slice(-2).join('').toUpperCase();
  return initials || '??';
}
function initialsAvatar(name, size = 160){
  const initials = initialsFromName(name);
  const svg = `
  <svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='#a5bde3'/>
        <stop offset='1' stop-color='#7aa1df'/>
      </linearGradient>
    </defs>
    <rect width='100%' height='100%' rx='16' fill='url(#g)'/>
    <text x='50%' y='58%' text-anchor='middle'
          font-family='ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto'
          font-weight='800' font-size='56' fill='white'>${initials}</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// ---- Rendu INFOS PRATIQUES (sans pratiques.md)
(function renderPratiques(){
  try {
    const reglementHTML = `
      <h3>📜 Règlement intérieur</h3>
      <p><strong>Règlement intérieur de la section Randonnée pédestre, Marche nordique, Audax et Bungy Pump</strong></p>
      <p>
        Merci de prendre connaissance du règlement intérieur avant toute inscription ou participation à nos activités.
      </p>
      <a href="assets/reglement-interieur.pdf" download class="btn">
        📄 Télécharger le règlement intérieur (PDF)
      </a>

      <hr class="divider">

      <h3>🩺 Questionnaire de santé</h3>
      <p>
        Pour une réinscription, merci de remplir le questionnaire de santé officiel et de remettre uniquement
        l’attestation signée au club si toutes les réponses sont "non".
      </p>
      <a href="https://www.formulaires.service-public.fr/gf/cerfa_15699.do" target="_blank" rel="noopener" class="btn">
        🔗 Accéder au questionnaire de santé (Cerfa n°15699*01)
      </a>
    `;

    document.getElementById('pratiques-content').innerHTML = reglementHTML;
  } catch(e) {
    console.error(e);
  }
})();


// ---- Rendu CRENEAUX (affiché sous "Infos pratiques")
(async function renderCreneaux(){
  try{
    const data = await getJSON('data/creneaux.json');
    const items = Array.isArray(data) ? data : (data.items || []);
    if (!items.length) return;

    // ordre des jours
    const order = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
    const groups = {};
    order.forEach(j => groups[j] = []);
    items.forEach(it => { if(groups[it.jour]) groups[it.jour].push(it); });

    // construire le HTML
    let html = `
      <hr/>
      <h3>🗓️ Créneaux d'activité</h3>
      <div class="creneaux">
    `;

    order.forEach(jour => {
      const rows = groups[jour];
      if (!rows || !rows.length) return;
      html += `
        <h4 class="creneaux__day">${jour}</h4>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Libellés</th>
                <th>Animat.</th>
                <th>Début</th>
                <th>Fin</th>
                <th>Lieu</th>
                <th>Période</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td>${r.libelle || ""}</td>
                  <td>${r.animateurs || ""}</td>
                  <td>${r.debut || ""}</td>
                  <td>${r.fin || ""}</td>
                  <td>${r.lieu || ""}</td>
                  <td>${r.periode || ""}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;
    });

    html += `</div>`;

    // insérer à la fin de #pratiques-content
    const cont = document.getElementById('pratiques-content');
    cont.insertAdjacentHTML('beforeend', html);
  } catch(e){
    console.error(e);
  }
})();


// ---- Google Calendar
const gcal = document.getElementById('gcal');
const icalLink = document.getElementById('ical-link');

const GCAL_BASE = "https://calendar.google.com/calendar/embed";
const CAL_SRC = "lespelousdeveyettes35@gmail.com";  // <-- RAW, NOT encoded
const CTZ = "Europe/Paris";
const ICAL_URL = ""; // put your .ics here if you have it

function buildSrc(view="MONTH"){
  const params = new URLSearchParams({
    src: CAL_SRC,              // URLSearchParams will encode once (correct)
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

(async function renderVieDuClub(){
  try {
    const content = await fetch('data/vie-du-club.md').then(r => r.text());
    // convertir le markdown -> html (si tu utilises marked.js ou autre)
    const html = marked.parse(content);
    document.getElementById('vie-du-club-content').innerHTML = html;
  } catch(e) {
    console.error("Erreur rendu Vie du club:", e);
  }
})();

