// netlify/functions/send-email.js
export async function handler(event) {
  try {
    const user = event.clientContext && event.clientContext.user;
    if (!user) return res(401, { error: 'Non connecté' });
    if (event.httpMethod !== 'POST') return res(405, { error: 'Méthode non supportée' });

    const { to, subject, content, html, from, replyTo } = JSON.parse(event.body || '{}');
    if (!Array.isArray(to) || to.length === 0) return res(400, { error: 'Champ "to" manquant' });

    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) return res(500, { error: 'SENDGRID_API_KEY non configurée' });

    const fromRaw = from || process.env.SENDGRID_DEFAULT_FROM;
    if (!fromRaw) return res(400, { error: 'Expéditeur non défini (from ou SENDGRID_DEFAULT_FROM)' });

    const fromObj = parseFrom(fromRaw);              // gère "Nom <email@...>"
    const replyToObj = replyTo ? parseFrom(replyTo) : undefined;

    const recipients = [...new Set(to.filter(Boolean))]; // déduplication simple
    const chunks = chunkArray(recipients, 900);

    for (const list of chunks) {
      const body = {
        personalizations: [{ to: list.map(e => ({ email: e })) }],
        from: fromObj,
        subject: subject || '(sans objet)',
        content: html
          ? [
              { type: 'text/plain', value: stripHtml(String(content || '')) },
              { type: 'text/html', value: String(html) }
            ]
          : [{ type: 'text/plain', value: String(content || '') }]
      };
      if (replyToObj) body.reply_to = replyToObj;
      if (process.env.SENDGRID_SANDBOX === '1') {
        body.mail_settings = { sandbox_mode: { enable: true } }; // tests sans envoi réel
      }

      const r = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!r.ok) {
        const txt = await r.text();
        return res(500, { error: `SendGrid: ${r.status} ${txt}` });
      }
    }

    return res(200, { ok: true, recipients: recipients.length });
  } catch (e) {
    return res(500, { error: e.message });
  }
}

// Utils
function res(statusCode, body) {
  return { statusCode, body: JSON.stringify(body) };
}
function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
function parseFrom(v) {
  const s = String(v || '');
  const m = s.match(/^\s*(?:"?([^"]+)"?\s*)?<([^<>\s@]+@[^<>\s@]+)>\s*$/);
  return m ? { name: m[1], email: m[2] } : { email: s };
}
function stripHtml(s) {
  return String(s).replace(/<[^>]*>/g, '');
}
