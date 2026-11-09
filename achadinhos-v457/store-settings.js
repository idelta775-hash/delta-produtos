/* V4.57 — only editorial fields are read from public Google Sheet; all inserted as plain text. */
(() => {
"use strict";
const config=window.DELTA_STORE_CONFIG||{};
const $=id=>document.getElementById(id);
const clean=(s,n=200)=>String(s??"").replace(/\s+/g," ").trim().slice(0,n);
async function rows(url) {
  if(!url?.startsWith("https://docs.google.com/spreadsheets/d/")) return [];
  const c=new AbortController(),tm=setTimeout(()=>c.abort(),Number(config.feedTimeoutMs||9000));
  try {
    const r=await fetch(url,{credentials:"omit",cache:"no-store",signal:c.signal});
    if(!r.ok)throw Error("Metadata HTTP "+r.status);
    return window.DeltaCatalog.parseGviz(await r.text(),false);
  }finally{clearTimeout(tm)}
}
async function load() {
  try {
    const [shop,cat]=await Promise.all([rows(config.storeFeedUrl),rows(config.categoryFeedUrl)]);
    const settings=Object.fromEntries(shop.map(r=>[clean(r.chave,70),clean(r.valor,300)]).filter(x=>x[0]));
    const title=$("hero-heading");
    if(title&&settings.titulo_abertura&&settings.titulo_realce){
      const strong=document.createElement("em");strong.textContent=settings.titulo_realce;
      title.replaceChildren(document.createTextNode(settings.titulo_abertura+" "),strong);
    }
    const hero=document.querySelector(".hero-copy>p");
    if(hero&&settings.texto_destaque)hero.textContent=settings.texto_destaque;
    const btn=document.querySelector(".hero-copy .primary-btn");
    if(btn&&settings.botao_destaque)btn.replaceChildren(document.createTextNode(settings.botao_destaque+" ↘"));
    const heading=$("catalog-heading");
    if(heading&&settings.titulo_catalogo)heading.textContent=settings.titulo_catalogo;
    const band=document.querySelector(".band-intro strong");
    if(band&&settings.chamada_categorias)band.textContent=settings.chamada_categorias;
    const footer=document.querySelector(".footer-inner>p");
    if(footer&&settings.rodape_slogan)footer.textContent=settings.rodape_slogan;
    const categoryMeta={};
    for (const row of cat) {
      const name=clean(row.categoria,60);
      if(!name || !/^[\p{L}\p{N} &-]{2,60}$/u.test(name))continue;
      categoryMeta[name]={symbol:clean(row.emoji,7)||"✦",active:clean(row.ativo,10).toUpperCase()!=="NAO",order:Number(row.ordem)||99};
    }
    window.DELTA_CATEGORY_META=categoryMeta;
    document.dispatchEvent(new Event("delta:storemeta"));
    return {source:"google_sheets",categories:Object.keys(categoryMeta).length};
  }catch(e){
    // The site continues with its original safe editorial defaults.
    return {source:"default",error:String(e.message||e)};
  }
}
window.DeltaStoreSettings={load};
load();
const every=Math.max(2,Number(config.syncIntervalMinutes||5))*60000;
window.setInterval(()=>{if(!document.hidden)load()},every);
})();
