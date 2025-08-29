// netlify/functions/get-adherents.js
// Si ton build se plaint des imports JSON, garde l'assert ; sinon tu peux le retirer.
import data from '../../data/adherents.json' assert { type: 'json' };

export async function handler(event) {
  try {
    const user = event.clientContext && event.clientContext.user;
    if (!user) {
      return res(401, { error: 'Non connecté' });
    }

    if (event.httpMethod !== 'GET') {
      return res(405, { error: 'Méthode non supportée' });
    }

    // ?code=A1 ou ?code=A1,B2
    const qraw = (event.queryStringParameters?.code || '').trim().toLowerCase();
    const codes = qraw
      ? qraw.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const items = Array.isArray(data?.items) ? data.items : [];

    const view = codes.length
      ? items.filter(m => {
          const c = String(m.code || '').toLowerCase();
          return codes.some(code => c.includes(code));
        })
      : items;

    return res(200, { items: view });
  } catch (e) {
    return res(500, { error: e.message });
  }
}

function res(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // éviter tout cache CDN/navigateur sur ces données
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
    },
    body: JSON.stringify(body)
  };
}
