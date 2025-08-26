document.addEventListener('DOMContentLoaded', () => {
  const y = document.getElementById('annee');
  if (y) y.textContent = new Date().getFullYear();

  const gcal = document.getElementById('gcal');
  const buttons = document.querySelectorAll('[data-view]');
  const ical = document.getElementById('ical-link');
  const gcalBase = 'https://calendar.google.com/calendar/embed?src=lespelousdeveyettes35%40gmail.com&ctz=Europe%2FParis';
  const setView = (mode) => {
    if (!gcal) return;
    gcal.src = `${gcalBase}&mode=${mode}&showTitle=0&showNav=1&showPrint=0&showTabs=1&showCalendars=0&showTz=0`;
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view===mode)));
  };
  buttons.forEach(btn => btn.addEventListener('click', () => setView(btn.dataset.view)));
  if (ical){ ical.href='https://calendar.google.com/calendar/ical/lespelousdeveyettes35%40gmail.com/public/basic.ics'; ical.style.display='inline-flex'; }

  const getText = async (p)=>{ const r=await fetch(p,{cache:'no-cache'}); if(!r.ok) throw new Error(p); return r.text(); };
  const getJSON = async (p)=>{ const r=await fetch(p,{cache:'no-cache'}); if(!r.ok) throw new Error(p); return r.json(); };

  const cleanLineBreaks = (root) => {
    root.querySelectorAll('p, li').forEach(el=>{
      el.innerHTML = el.innerHTML.replace(/<br\s*\/?>/gi,' ').replace(/\s{2,}/g,' ').trim();
    });
  };
  const enhanceProse = (el) => {
    if (!el) return;
    cleanLineBreaks(el);
    const firstP = el.querySelector('p');
    if (firstP && firstP.textContent.trim().length > 60) firstP.classList.add('lead-p');
    el.querySelectorAll('ul').forEach(ul => ul.classList.add('list-clean'));
    el.querySelectorAll('hr').forEach(hr => hr.classList.add('rule'));
    el.querySelectorAll('blockquote').forEach(bq => bq.classList.add('callout'));
  };

  const vieEl = document.getElementById('vie-du-club-content');
  if (vieEl) {
    getText('data/vie-du-club.md')
      .then(md => { vieEl.innerHTML = marked.parse(md); enhanceProse(vieEl); })
      .catch(() => { vieEl.innerHTML = '<p class="muted">Contenu à venir.</p>'; });
  }

  const praEl = document.getElementById('pratiques-content');
  const PRACTIQUES_HTML = `
    <div class="doc-grid">
      <div class="doc-card">
        <div class="doc-card-header">
          <div class="icon" aria-hidden="true">📄</div>
          <h3>Règlement intérieur</h3>
        </div>
        <p>Règlement intérieur de la section Randonnée pédestre, Marche nordique, Audax et Bungy Pump.</p>
        <p>Merci de prendre connaissance du règlement avant toute inscription ou participation à nos activités.</p>
        <div class="btn-row">
          <a class="btn btn--primary" href="assets/docs/interieur.pdf" target="_blank" rel="noopener">
            Télécharger le règlement (PDF)
          </a>
        </div>
      </div>
      <div class="doc-card">
        <div class="doc-card-header">
          <div class="icon" aria-hidden="true">🩺</div>
          <h3>Questionnaire de santé</h3>
        </div>
        <p>Pour une réinscription, remplissez le questionnaire de santé officiel et remettez uniquement l’attestation signée si toutes les réponses sont « non ».</p>
        <div class="btn-row">
          <a class="btn btn--primary" href="https://www.formulaires.service-public.fr/gf/cerfa_15699.do" target="_blank" rel="noopener">
            Accéder au questionnaire (Cerfa n°15699*01)
          </a>
        </div>
      </div>
    </div>`;
  if (praEl) praEl.innerHTML = PRACTIQUES_HTML;

  const membersWrap = document.getElementById('members');
  if (membersWrap) {
    getJSON('data/members.json')
      .then((payload) => {
        let members = [];
        if (Array.isArray(payload)) members = payload;
        else if (payload && Array.isArray(payload.items)) members = payload.items;

        if (!Array.isArray(members) || members.length === 0) {
          membersWrap.innerHTML = '<p class="muted">Liste en cours de mise à jour.</p>';
          return;
        }

        membersWrap.classList.add('cards');
        membersWrap.innerHTML = members.map((m) => {
          const name = m.nom || '';
          const role = m.poste || '';
          const telRaw = (m.telephone || '').replace(/\s+/g, '');
          const tel = m.telephone || '';
          const email = m.email || '';

          const initials = name.split(/\s+/).filter(Boolean).map(p => p.charAt(0).toUpperCase()).slice(0, 2).join('');
          const hasRealPhoto = m.photo && !/placeholder\.(png|jpg|jpeg|webp)$/i.test(m.photo);
          const avatar = hasRealPhoto
            ? `<div class="avatar"><img src="${m.photo}" alt="${name}"></div>`
            : `<div class="avatar avatar--fallback" aria-hidden="true">${initials || "?"}</div>`;
          const badge = role ? `<div class="badge">${role}</div>` : '';

          const chips = `
            <div class="contact">
              ${email ? `<a href="mailto:${email}" title="Envoyer un e-mail">${email}</a>` : ''}
              ${telRaw ? `<a href="tel:${telRaw}" title="Appeler">${tel}</a>` : ''}
            </div>`;

          return `
            <article class="member-card">
              ${avatar}
              <h3>${name}</h3>
              ${badge}
              ${chips}
            </article>`;
        }).join('');
      })
      .catch((err) => {
        console.error('[members.json] erreur:', err);
        membersWrap.innerHTML = '<p class="muted">Impossible de charger les membres.</p>';
      });
  }
});
