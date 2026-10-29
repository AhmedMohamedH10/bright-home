// Cloudflare Worker — بيستقبل الطلب من الموقع ويبعته واتساب لرقم تحضير الطلبات (WhatsApp Cloud API)
// Secrets/Vars لازم تتضبط: WA_TOKEN, WA_PHONE_ID, PREP_NUMBER (دولي بدون +), ALLOWED_ORIGIN (دومين الموقع)
export default {
  async fetch(req, env) {
    const cors = { 'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*', 'Access-Control-Allow-Methods': 'POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'POST') return new Response('ok', { headers: cors });
    let o; try { o = await req.json(); } catch { return new Response('bad json', { status: 400, headers: cors }); }
    const text = String(o.text || '').slice(0, 3500);
    if (text.length < 20) return new Response('empty', { status: 400, headers: cors });
    const r = await fetch(`https://graph.facebook.com/v21.0/${env.WA_PHONE_ID}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.WA_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: env.PREP_NUMBER, type: 'text', text: { body: '🛒 طلب جديد من الموقع\n\n' + text } }),
    });
    return new Response(r.ok ? 'sent' : 'failed', { status: r.ok ? 200 : 502, headers: cors });
  },
};
