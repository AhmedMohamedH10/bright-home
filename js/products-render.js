/* بيرسم كروت المنتجات من PRODUCTS (js/products-data.js) — صورة الكراتين ثابتة ورا كل منتج */
(function(){
  const g=document.getElementById('grid'); if(!g||typeof PRODUCTS==='undefined')return;
  window.BH_PACKS={}; window.BH_HAS_M={};
  const fn=s=>s.split('/').pop();
  const E=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const img=(o,alt,cls)=>{const n=fn(o.src),m='assets/products/m/'+n;
    if(o.mw)window.BH_HAS_M[n]=[o.mw,o.w];
    return `<img decoding="async" width="${o.w}" height="${o.h}"${cls?` class="${cls}"`:''} src="${E(o.src)}"${o.mw?` srcset="${m} ${o.mw}w, ${E(o.src)} ${o.w}w" sizes="170px"`:''} alt="${E(alt)}" loading="lazy">`;};
  g.innerHTML=PRODUCTS.map((p,i)=>{
    const V=p.variants||[]; if(!V.length||!p.img)return '';
    V.forEach(v=>window.BH_PACKS[v.sku]={pack:+v.pack||1,unit:v.unit||'قطعة'});
    const any=V.some(v=>v.img),vs=V.map(v=>({sku:v.sku,label:v.label,cat:v.cat,alt:v.sku,hue:v.hue||p.hue,...(v.img||any?{img:(v.img||p.img).src}:{})}));
    V.forEach(v=>{if(v.img)img(v.img,'')});
    const v0=V[0];
    return `<article class="card tilt reveal${V.length>1?' has-var':''}" data-variants="${E(JSON.stringify(vs))}" data-cat="${E(p.cat)}" style="--d:${(i%4)/10}s;--hue:${E(p.hue)}">
<div class="c-vis"><span class="c-tag">${E(p.tag)}</span><i class="c-glow"></i><img decoding="async" class="c-boxes" src="assets/img/boxes.webp" srcset="assets/img/boxes-m.webp 534w, assets/img/boxes.webp 801w" sizes="230px" width="801" height="900" alt="" aria-hidden="true" draggable="false" loading="lazy">${img(p.img,v0.sku,p.cls)}</div>
<div class="c-info"><span class="c-cat">${E(v0.cat)}</span><h3>${E(v0.label)}</h3><p>${E(p.desc)}</p>
<button class="btn btn-card order-product" type="button" data-product="${E(v0.sku)}">اطلب المنتج <span class="arr">↙</span></button></div></article>`;
  }).join('');
})();
