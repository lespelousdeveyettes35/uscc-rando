// netlify/functions/get-adherents.js
import data from '../../data/adherents.json';

export async function handler(event) {
  try {
    const user = event.clientContext && event.clientContext.user;
    if (!user) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Non connecté' }) };
    }

    const params = new URLSearchParams(event.queryStringParameters || {});
    const q = (params.get('code') || '').trim().toLowerCase();

    const items = Array.isArray(data.items) ? data.items : [];
    const view = q ? items.filter(m => String(m.code || '').toLowerCase().includes(q)) : items;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ items: view })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
}
