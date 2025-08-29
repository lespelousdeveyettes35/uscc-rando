export async function handler(event) {
  try {
    const user = event.clientContext && event.clientContext.user;
    if (!user) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Non connecté' }) };
    }

    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Méthode non supportée' }) };
    }

    const { to, subject, content, from } = JSON.parse(event.body || '{}');
    if (!Array.isArray(to) || to.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Champ \"to\" manquant' }) };
    }

    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'SENDGRID_API_KEY non configurée' }) };
    }

    const fromEmail = from || process.env.SENDGRID_DEFAULT_FROM;
    if (!fromEmail) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Expéditeur non défini' }) };
    }

    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: to.map(e => ({ email: e })) }],
        from: { email: fromEmail },
        subject: subject || '(sans objet)',
        content: [{ type: 'text/plain', value: String(content||'') }]
      })
    });

    if (!res.ok) {
      const txt = await res.text();
      return { statusCode: 500, body: JSON.stringify({ error: `SendGrid: ${res.status} ${txt}` }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
}
