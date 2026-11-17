/* =========================================================
   Bright Home — سيرفر لوحة التحكم (Cloudflare Worker)
   بيدير: تسجيل الدخول، الأدوار (مطوّر / مالك / محرّر)، والنشر على GitHub.
   الإعدادات (الخطوات في server/ADMIN-SETUP.md):
     KV binding : BH_KV
     Variables  : GH_REPO (مثال AhmedMohamedH10/bright-home) · GH_BRANCH (main) · ALLOWED_ORIGIN (https://brighthome-eg.shop)
     Secrets    : GH_TOKEN · SESSION_SECRET · DEV_USER · DEV_PASSWORD
   ========================================================= */
const E = new TextEncoder(), PERMS = ['products', 'distributors'], ADMIN = [...PERMS, 'settings'];
const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json' } });
const T = (m, s) => { const e = new Error(m); e.s = s; return e; };
const b64u = b => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const rnd = () => b64u(crypto.getRandomValues(new Uint8Array(16)));
const safeEq = (a, b) => { a = String(a); b = String(b); let d = a.length ^ b.length; for (let i = 0; i < Math.max(a.length, b.length); i++) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0); return d === 0; };
async function sign(k, d) { const key = await crypto.subtle.importKey('raw', E.encode(k), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); return b64u(await crypto.subtle.sign('HMAC', key, E.encode(d))); }
async function pbk(pw, salt) { const k = await crypto.subtle.importKey('raw', E.encode(pw), 'PBKDF2', false, ['deriveBits']); return b64u(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: E.encode(salt), iterations: 100000 }, k, 256)); }
const gh = (env, p, o = {}) => fetch('https://api.github.com/repos/' + env.GH_REPO + p, { ...o, headers: { Authorization: 'Bearer ' + env.GH_TOKEN, Accept: 'application/vnd.github+json', 'User-Agent': 'bh-admin', 'Content-Type': 'application/json', ...(o.headers || {}) } });
const need = p => p === 'js/products-data.js' || /^assets\/products\/(m\/)?n[a-z0-9]+\.webp$/.test(p) ? 'products' : p === 'js/distributors-data.js' ? 'distributors' : p === 'js/settings-data.js' ? 'settings' : null;
const canManage = (me, role) => me.role === 'developer' || (me.role === 'owner' && role === 'editor');
const okUser = u => /^[a-z0-9_.-]{3,30}$/.test(u);

async function who(req, env) {
  const [p, s] = (req.headers.get('Authorization') || '').slice(7).split('.');
  if (!p || !s || !safeEq(s, await sign(env.SESSION_SECRET, p))) throw T('سجّل دخول الأول', 401);
  const d = JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/')));
  if (d.exp < Date.now()) throw T('انتهت الجلسة، سجّل دخول تاني', 401);
  if (d.u === String(env.DEV_USER).toLowerCase()) return { u: d.u, name: 'المطوّر', role: 'developer', perms: ADMIN };
  const r = await env.BH_KV.get('u:' + d.u, 'json'); if (!r) throw T('الحساب ده اتحذف', 401);
  return { u: d.u, name: r.name, role: r.role, perms: r.role === 'owner' ? ADMIN : r.perms };
}
async function audit(env, u, a) { const l = JSON.parse(await env.BH_KV.get('log') || '[]'); l.unshift({ t: Date.now(), u, a }); await env.BH_KV.put('log', JSON.stringify(l.slice(0, 100))); }
const raw = async (env, p) => { const r = await gh(env, `/contents/${p}?ref=${env.GH_BRANCH || 'main'}`, { headers: { Accept: 'application/vnd.github.raw+json' } }); if (!r.ok) throw T('مش قادر أقرأ من GitHub', 502); return r.text(); };

async function route(req, env) {
  const url = new URL(req.url), path = url.pathname, m = req.method, body = m === 'GET' || m === 'DELETE' ? {} : await req.json().catch(() => ({}));
  if (path === '/login' && m === 'POST') {
    const u = String(body.username || '').toLowerCase(), pw = String(body.password || ''), ip = req.headers.get('CF-Connecting-IP') || 'x', k = 'rl:' + ip, n = +(await env.BH_KV.get(k) || 0);
    if (n >= 8) throw T('محاولات كتير — جرّب بعد 15 دقيقة', 429);
    let ok = false;
    if (u === String(env.DEV_USER).toLowerCase()) ok = safeEq(pw, env.DEV_PASSWORD);
    else { const r = okUser(u) && await env.BH_KV.get('u:' + u, 'json'); ok = !!r && safeEq(await pbk(pw, r.salt), r.hash); }
    if (!ok) { await env.BH_KV.put(k, String(n + 1), { expirationTtl: 900 }); throw T('اسم المستخدم أو كلمة السر غلط', 401); }
    await env.BH_KV.delete(k);
    const p = b64u(E.encode(JSON.stringify({ u, exp: Date.now() + 12 * 36e5 })));
    return J({ token: p + '.' + await sign(env.SESSION_SECRET, p) });
  }
  const me = await who(req, env);
  if (path === '/me') return J(me);
  if (path === '/data') return J({ products: me.perms.includes('products') ? await raw(env, 'js/products-data.js') : null, distributors: me.perms.includes('distributors') ? await raw(env, 'js/distributors-data.js') : null, settings: me.perms.includes('settings') ? await raw(env, 'js/settings-data.js').catch(() => null) : null });

  if (path === '/publish' && m === 'POST') {
    const fs = Array.isArray(body.files) ? body.files : []; if (!fs.length || fs.length > 80) throw T('مفيش ملفات للنشر', 400);
    for (const f of fs) { const n = need(f.path); if (!n) throw T('مسار غير مسموح: ' + f.path, 403); if (!me.perms.includes(n)) throw T('ماعندكش صلاحية على: ' + f.path, 403); if (String(f.b64).length > 3e6) throw T('ملف كبير: ' + f.path, 413); }
    const br = env.GH_BRANCH || 'main', ref = await (await gh(env, '/git/ref/heads/' + br)).json(), cm = await (await gh(env, '/git/commits/' + ref.object.sha)).json(), tree = [];
    for (const f of fs) { const r = await gh(env, '/git/blobs', { method: 'POST', body: JSON.stringify({ content: f.b64, encoding: 'base64' }) }); if (!r.ok) throw T('فشل رفع ' + f.path, 502); tree.push({ path: f.path, mode: '100644', type: 'blob', sha: (await r.json()).sha }); }
    const t = await (await gh(env, '/git/trees', { method: 'POST', body: JSON.stringify({ base_tree: cm.tree.sha, tree }) })).json();
    const c = await (await gh(env, '/git/commits', { method: 'POST', body: JSON.stringify({ message: `تحديث من لوحة التحكم — ${me.u}`, tree: t.sha, parents: [ref.object.sha] }) })).json();
    const u = await gh(env, '/git/refs/heads/' + br, { method: 'PATCH', body: JSON.stringify({ sha: c.sha }) }); if (!u.ok) throw T('فشل النشر على GitHub', 502);
    await audit(env, me.u, 'نشر ' + fs.length + ' ملف'); return J({ ok: true });
  }

  if (path === '/me/password' && m === 'POST') {
    if (me.role === 'developer') throw T('كلمة سر المطوّر بتتغير من إعدادات Cloudflare', 400);
    const r = await env.BH_KV.get('u:' + me.u, 'json'); if (!safeEq(await pbk(String(body.old || ''), r.salt), r.hash)) throw T('كلمة السر الحالية غلط', 403);
    if (String(body.new || '').length < 8) throw T('كلمة السر 8 حروف على الأقل', 400);
    r.salt = rnd(); r.hash = await pbk(body.new, r.salt); await env.BH_KV.put('u:' + me.u, JSON.stringify(r)); return J({ ok: true });
  }

  if (path === '/log') { if (me.role === 'editor') throw T('غير مسموح', 403); return J({ log: JSON.parse(await env.BH_KV.get('log') || '[]') }); }

  if (path === '/users' || path.startsWith('/users/')) {
    if (me.role === 'editor') throw T('غير مسموح', 403);
    const target = decodeURIComponent(path.slice(7)).toLowerCase();
    if (path === '/users' && m === 'GET') {
      const ks = (await env.BH_KV.list({ prefix: 'u:' })).keys, users = [];
      for (const k of ks) { const r = await env.BH_KV.get(k.name, 'json'); if (r && canManage(me, r.role)) users.push({ username: k.name.slice(2), name: r.name, role: r.role, perms: r.perms, created: r.created, by: r.by }); }
      return J({ users });
    }
    if (path === '/users' && m === 'POST') {
      const u = String(body.username || '').toLowerCase(), role = body.role;
      if (!okUser(u) || u === String(env.DEV_USER).toLowerCase()) throw T('اسم المستخدم لازم حروف إنجليزي/أرقام (3-30)', 400);
      if (!['owner', 'editor'].includes(role) || !canManage(me, role)) throw T('ماعندكش صلاحية تضيف الدور ده', 403);
      if (String(body.password || '').length < 8) throw T('كلمة السر 8 حروف على الأقل', 400);
      if (await env.BH_KV.get('u:' + u)) throw T('اسم المستخدم موجود', 409);
      const salt = rnd(), perms = role === 'owner' ? PERMS : (body.perms || []).filter(p => PERMS.includes(p) && me.perms.includes(p));
      await env.BH_KV.put('u:' + u, JSON.stringify({ name: String(body.name || u).slice(0, 60), role, perms, salt, hash: await pbk(body.password, salt), created: Date.now(), by: me.u }));
      await audit(env, me.u, 'أضاف مستخدم ' + u); return J({ ok: true });
    }
    const r = await env.BH_KV.get('u:' + target, 'json'); if (!r) throw T('المستخدم مش موجود', 404);
    if (!canManage(me, r.role)) throw T('ماعندكش صلاحية على المستخدم ده', 403);
    if (m === 'DELETE') { await env.BH_KV.delete('u:' + target); await audit(env, me.u, 'حذف مستخدم ' + target); return J({ ok: true }); }
    if (m === 'PATCH') {
      if (body.name) r.name = String(body.name).slice(0, 60);
      if (Array.isArray(body.perms) && r.role === 'editor') r.perms = body.perms.filter(p => PERMS.includes(p) && me.perms.includes(p));
      if (body.password) { if (String(body.password).length < 8) throw T('كلمة السر 8 حروف على الأقل', 400); r.salt = rnd(); r.hash = await pbk(body.password, r.salt); }
      await env.BH_KV.put('u:' + target, JSON.stringify(r)); await audit(env, me.u, 'عدّل مستخدم ' + target); return J({ ok: true });
    }
  }
  throw T('مش موجود', 404);
}

export default {
  async fetch(req, env) {
    const cors = { 'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*', 'Access-Control-Allow-Headers': 'Content-Type,Authorization', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS', Vary: 'Origin' };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    let r; try { r = await route(req, env); } catch (e) { r = J({ error: e.message || 'خطأ' }, e.s || 500); }
    Object.entries(cors).forEach(([k, v]) => r.headers.set(k, v)); return r;
  }
};
