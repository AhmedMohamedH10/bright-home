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
  if (!p || !s || !safeEq(s, await sign(env.SESSION_SECRET, p))) throw T('سجّل الدخول أولًا', 401);
  const d = JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/')));
  if (d.exp < Date.now()) throw T('انتهت الجلسة، سجّل الدخول مجددًا', 401);
  if (d.u === String(env.DEV_USER).toLowerCase()) return { u: d.u, name: 'المطوّر', role: 'developer', perms: ADMIN };
  const r = await env.BH_KV.get('u:' + d.u, 'json'); if (!r) throw T('تم حذف هذا الحساب', 401);
  return { u: d.u, name: r.name, role: r.role, perms: r.role === 'owner' ? ADMIN : r.perms };
}
const clean = (x, n) => String(x ?? '').replace(/[\u0000-\u001f]/g, ' ').slice(0, n);
async function audit(env, me, items) {
  const t = Date.now(), rows = (Array.isArray(items) ? items : [items]).map(x => ({ t, u: clean(me.u, 30), n: clean(me.name, 60), k: x.k, g: x.g, a: clean(x.a, 220) }));
  try { const l = JSON.parse(await env.BH_KV.get('log') || '[]'); l.unshift(...rows); await env.BH_KV.put('log', JSON.stringify(l.slice(0, 500))); return true; } catch (e) { return false; /* فشل السجل لا يعطّل العملية، لكن يُبلَّغ به */ }
}
const VER = 2, GRP = { products: 'prod', distributors: 'dist', settings: 'set' }, KINDS = ['add', 'edit', 'del', 'set'];
const raw = async (env, p) => { const r = await gh(env, `/contents/${p}?ref=${env.GH_BRANCH || 'main'}`, { headers: { Accept: 'application/vnd.github.raw+json' } }); if (!r.ok) throw T('تعذّرت القراءة من GitHub', 502); return r.text(); };

async function route(req, env) {
  const url = new URL(req.url), path = url.pathname, m = req.method, body = m === 'GET' || m === 'DELETE' ? {} : await req.json().catch(() => ({}));
  if (path === '/login' && m === 'POST') {
    const u = String(body.username || '').toLowerCase(), pw = String(body.password || ''), ip = req.headers.get('CF-Connecting-IP') || 'x', k = 'rl:' + ip, n = +(await env.BH_KV.get(k) || 0);
    if (n >= 8) throw T('محاولات كثيرة. حاول بعد 15 دقيقة', 429);
    let ok = false, nm = '';
    if (u === String(env.DEV_USER).toLowerCase()) { ok = safeEq(pw, env.DEV_PASSWORD); nm = 'المطوّر'; }
    else { const r = okUser(u) && await env.BH_KV.get('u:' + u, 'json'); ok = !!r && safeEq(await pbk(pw, r.salt), r.hash); nm = r ? r.name : ''; }
    if (!ok) { await env.BH_KV.put(k, String(n + 1), { expirationTtl: 900 }); await audit(env, { u: u.replace(/[^a-z0-9_.-]/g, '').slice(0, 30) || '؟', name: '' }, { k: 'sec', g: 'lgn', a: 'محاولة دخول فاشلة' }); throw T('اسم المستخدم أو كلمة المرور غير صحيح', 401); }
    await env.BH_KV.delete(k); await audit(env, { u, name: nm }, { k: 'in', g: 'lgn', a: 'تسجيل دخول' });
    const p = b64u(E.encode(JSON.stringify({ u, exp: Date.now() + 12 * 36e5 })));
    return J({ token: p + '.' + await sign(env.SESSION_SECRET, p) });
  }
  const me = await who(req, env);
  if (path === '/me') return J(me);
  if (path === '/data') return J({ products: me.perms.includes('products') ? await raw(env, 'js/products-data.js') : null, distributors: me.perms.includes('distributors') ? await raw(env, 'js/distributors-data.js') : null, settings: me.perms.includes('settings') ? await raw(env, 'js/settings-data.js').catch(() => null) : null });

  if (path === '/publish' && m === 'POST') {
    const fs = Array.isArray(body.files) ? body.files : []; if (!fs.length || fs.length > 80) throw T('لا توجد ملفات للنشر', 400);
    for (const f of fs) { const n = need(f.path); if (!n) throw T('مسار غير مسموح: ' + f.path, 403); if (!me.perms.includes(n)) throw T('لا تملك صلاحية على: ' + f.path, 403); if (String(f.b64).length > 3e6) throw T('الملف كبير: ' + f.path, 413); }
    const dom = new Set(fs.map(f => need(f.path))), ch = (Array.isArray(body.changes) ? body.changes : []).slice(0, 60).filter(c => c && dom.has(c.d) && me.perms.includes(c.d) && KINDS.includes(c.k) && typeof c.a === 'string' && c.a.trim());
    const br = env.GH_BRANCH || 'main', ref = await (await gh(env, '/git/ref/heads/' + br)).json(), cm = await (await gh(env, '/git/commits/' + ref.object.sha)).json(), tree = [];
    for (const f of fs) { const r = await gh(env, '/git/blobs', { method: 'POST', body: JSON.stringify({ content: f.b64, encoding: 'base64' }) }); if (!r.ok) throw T('فشل رفع ' + f.path, 502); tree.push({ path: f.path, mode: '100644', type: 'blob', sha: (await r.json()).sha }); }
    const t = await (await gh(env, '/git/trees', { method: 'POST', body: JSON.stringify({ base_tree: cm.tree.sha, tree }) })).json();
    const c = await (await gh(env, '/git/commits', { method: 'POST', body: JSON.stringify({ message: `تحديث من لوحة التحكم — ${me.u}`, tree: t.sha, parents: [ref.object.sha] }) })).json();
    const u = await gh(env, '/git/refs/heads/' + br, { method: 'PATCH', body: JSON.stringify({ sha: c.sha }) }); if (!u.ok) throw T('فشل النشر على GitHub', 502);
    const logged = await audit(env, me, [{ k: 'pub', g: 'pub', a: 'نشر ' + fs.length + ' ملف' + (ch.length ? ' (' + ch.length + ' تغيير)' : '') }, ...ch.map(c => ({ k: c.k, g: GRP[c.d], a: c.a }))]); return J({ ok: true, v: VER, logged });
  }

  if (path === '/me/password' && m === 'POST') {
    if (me.role === 'developer') throw T('تُغيَّر كلمة مرور المطوّر من إعدادات Cloudflare', 400);
    const r = await env.BH_KV.get('u:' + me.u, 'json'); if (!safeEq(await pbk(String(body.old || ''), r.salt), r.hash)) throw T('كلمة المرور الحالية غير صحيحة', 403);
    if (String(body.new || '').length < 8) throw T('كلمة المرور 8 أحرف على الأقل', 400);
    r.salt = rnd(); r.hash = await pbk(body.new, r.salt); await env.BH_KV.put('u:' + me.u, JSON.stringify(r)); await audit(env, me, { k: 'edit', g: 'usr', a: 'غيّر كلمة مروره' }); return J({ ok: true });
  }

  if (path === '/log') { if (me.role !== 'developer') throw T('غير مسموح', 403); return J({ v: VER, log: JSON.parse(await env.BH_KV.get('log') || '[]') }); }

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
      if (!okUser(u) || u === String(env.DEV_USER).toLowerCase()) throw T('اسم المستخدم: أحرف إنجليزية أو أرقام (3–30)', 400);
      if (!['owner', 'editor'].includes(role) || !canManage(me, role)) throw T('لا تملك صلاحية إضافة هذا الدور', 403);
      if (String(body.password || '').length < 8) throw T('كلمة المرور 8 أحرف على الأقل', 400);
      if (await env.BH_KV.get('u:' + u)) throw T('اسم المستخدم مستخدم مسبقًا', 409);
      const salt = rnd(), perms = role === 'owner' ? PERMS : (body.perms || []).filter(p => PERMS.includes(p) && me.perms.includes(p));
      await env.BH_KV.put('u:' + u, JSON.stringify({ name: String(body.name || u).slice(0, 60), role, perms, salt, hash: await pbk(body.password, salt), created: Date.now(), by: me.u }));
      await audit(env, me, { k: 'add', g: 'usr', a: 'أضاف المستخدم ' + u + ' (' + (role === 'owner' ? 'مالك' : 'محرّر: ' + (perms.map(x => x === 'products' ? 'المنتجات' : 'الموزّعون').join('، ') || 'بدون صلاحيات')) + ')' }); return J({ ok: true });
    }
    const r = await env.BH_KV.get('u:' + target, 'json'); if (!r) throw T('المستخدم غير موجود', 404);
    if (!canManage(me, r.role)) throw T('لا تملك صلاحية على هذا المستخدم', 403);
    if (m === 'DELETE') { await env.BH_KV.delete('u:' + target); await audit(env, me, { k: 'del', g: 'usr', a: 'حذف المستخدم ' + target }); return J({ ok: true }); }
    if (m === 'PATCH') {
      if (body.name) r.name = String(body.name).slice(0, 60);
      if (Array.isArray(body.perms) && r.role === 'editor') r.perms = body.perms.filter(p => PERMS.includes(p) && me.perms.includes(p));
      if (body.password) { if (String(body.password).length < 8) throw T('كلمة المرور 8 أحرف على الأقل', 400); r.salt = rnd(); r.hash = await pbk(body.password, r.salt); }
      await env.BH_KV.put('u:' + target, JSON.stringify(r)); await audit(env, me, { k: 'edit', g: 'usr', a: 'عدّل المستخدم ' + target + ': ' + [body.name && 'الاسم', Array.isArray(body.perms) && r.role === 'editor' && 'الصلاحيات (' + (r.perms.map(x => x === 'products' ? 'المنتجات' : 'الموزّعون').join('، ') || 'بدون') + ')', body.password && 'كلمة المرور'].filter(Boolean).join('، ') }); return J({ ok: true });
    }
  }
  throw T('غير موجود', 404);
}

export default {
  async fetch(req, env) {
    const cors = { 'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*', 'Access-Control-Allow-Headers': 'Content-Type,Authorization', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS', Vary: 'Origin' };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    let r; try { r = await route(req, env); } catch (e) { r = J({ error: e.message || 'خطأ' }, e.s || 500); }
    Object.entries(cors).forEach(([k, v]) => r.headers.set(k, v)); return r;
  }
};
