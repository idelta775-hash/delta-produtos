/* DELTA Affiliate V4.57 — public read-only Google Sheets feed; no credentials, no writes. */
(() => {
"use strict";
const config=window.DELTA_STORE_CONFIG || {};
const clean=(x,max=250)=>String(x==null?"":x).replace(/\s+/g," ").trim().slice(0,max);
const domain=(url)=>{try { const u=new URL(url);return u.protocol==="https:" && !u.username && !u.password?u.hostname.toLowerCase():""; }catch(_){return ""}};
function validMarketplace(url,market) {
  const allowed=config.enabledMarketplaces?.[market];
  if (!allowed || domain(url)!==allowed.hostname) return false;
  const u=new URL(url);
  return new RegExp(allowed.pathPattern).test(u.pathname) && !u.search && !u.hash;
}
function licensedImage(url,license) {
  return license==="APROVADA_PUBLICIDADE" && Boolean(url) && Array.isArray(config.imageHosts)
    && config.imageHosts.includes(domain(url)) && /\.(?:jpg|jpeg|png|webp)(?:$|\?)/i.test(url);
}
function price(value) {
  if(value==null || String(value).trim()==="")return null;
  const s=String(value).trim().replace(/[R$\s]/g,"");
  const t=s.includes(",")?s.replace(/\./g,"").replace(",","."):s;
  const n=Number(t);
  return Number.isFinite(n)&&n>0&&n<200000?Math.round(n*100)/100:null;
}
function recent(dateString,hours) {
  if(!dateString) return false;
  const s=clean(dateString,32);
  if(!/^\d{4}-\d\d-\d\d(?:[T ]\d\d:\d\d(?::\d\d)?)?(?:Z|[+-]\d\d:\d\d)?$/.test(s))return false;
  const t=Date.parse(s.length===10?s+"T12:00:00-03:00":s);
  return Number.isFinite(t)&&t<=Date.now()+3600000&&(Date.now()-t)<hours*3600000;
}
function parseGviz(text,requireProductHeaders=true) {
  const open=text.indexOf("{"),close=text.lastIndexOf("}");
  if(open<0||close<=open||open>150) throw Error("Invalid Google Sheets response");
  const data=JSON.parse(text.slice(open,close+1));
  if(data.status!=="ok"||!data.table || !Array.isArray(data.table.cols)||!Array.isArray(data.table.rows)) throw Error("Invalid Google Sheets table");
  const headers=data.table.cols.map(c=>clean(c.label,70));
  const essential=["status","produto_id","nome","categoria","marketplace","link_afiliado","comprovante_link"];
  if(requireProductHeaders && essential.some(name=>!headers.includes(name)))throw Error("Missing catalog columns");
  if(data.table.rows.length>Number(config.maxRows||3000))throw Error("Unsafe catalog size");
  return data.table.rows.map(r=>Object.fromEntries(headers.map((key,i)=>[key,r.c?.[i]?.v??""]))).filter(row=>Object.values(row).some(Boolean));
}
function validRows(rows) {
  const seen=new Set(),products=[];
  for(const row of rows) {
    if(clean(row.status,20).toUpperCase()!=="ATIVO")continue;
    if(clean(row.comprovante_link,30)!=="OFFICIAL_PORTAL")continue;
    const marketplace=clean(row.marketplace,50);
    const affiliate_url=clean(row.link_afiliado,300);
    if(!validMarketplace(affiliate_url,marketplace)||seen.has(affiliate_url))continue;
    const id=clean(row.produto_id,80), title=clean(row.nome,170);
    if(!id||!title || !/^[A-Za-z0-9_-]{6,80}$/.test(id))continue;
    seen.add(affiliate_url);
    const fresh=recent(row.ultima_verificacao,Number(config.priceFreshnessHours||48));
    const amount=fresh?price(row.preco_brl):null;
    const old=fresh?price(row.preco_antigo_brl):null;
    // Coupons are only published from the separate, evidence-reviewed Cupons tab.
    const photo=clean(row.imagem_url,400);
    products.push({
      id,title,category:clean(row.categoria,60)||"Outros",
      marketplace, affiliate_url,
      description:clean(row.descricao,360),subtitle:"",
      image_url:licensedImage(photo,row.imagem_licenca)?photo:null,
      image_publication_license:row.imagem_licenca==="APROVADA_PUBLICIDADE"?"approved_for_public_marketing":"not_verified",
      price_brl:amount,old_price_brl:old&&amount&&old>amount?old:null,
      coupon:null,coupon_expiry:null,
      featured:clean(row.destaque,10).toUpperCase()==="SIM",
      source:clean(row.origem,220),
      last_verified_at:fresh?clean(row.ultima_verificacao,32):null
    });
  }
  return products;
}
function sanitizeStatic(obj) {
  if(!obj || !Array.isArray(obj.products))throw Error("Invalid fallback");
  return obj.products.filter(p=>p?.title && validMarketplace(p.affiliate_url,p.marketplace)).map(p=>({
    ...p,price_brl:null,old_price_brl:null,coupon:null,coupon_expiry:null,
    image_url:p.image_publication_license==="approved_for_public_marketing" && licensedImage(p.image_url,"APROVADA_PUBLICIDADE")?p.image_url:null
  }));
}
async function getText(url,timeout=9000) {
  const ac=new AbortController();
  const timer=setTimeout(()=>ac.abort(),timeout);
  try {
    const r=await fetch(url,{cache:"no-store",credentials:"omit",signal:ac.signal,mode:"cors"});
    if(!r.ok)throw Error("Feed HTTP "+r.status);
    return await r.text();
  }finally{clearTimeout(timer)}
}
async function attachVerifiedCoupons(products){
  if(!config.couponFeedUrl) return products;
  try{
    const rows=parseGviz(await getText(config.couponFeedUrl,config.feedTimeoutMs),false);
    const byId=new Map(products.map(p=>[p.id,p]));
    for(const row of rows){
      if(clean(row.status).toUpperCase()!=="ATIVO")continue;
      const p=byId.get(clean(row.produto_id,80));
      if(!p||p.marketplace!==clean(row.marketplace,50))continue;
      const expiry=clean(row.cupom_validade,10),date=clean(row.verificado_em,32);
      const source=clean(row.fonte_oficial,400);
      if(!/^\d{4}-\d{2}-\d{2}$/.test(expiry)||!recent(date,Number(config.priceFreshnessHours||48)))continue;
      if(Date.parse(expiry+"T23:59:59-03:00")<=Date.now())continue;
      if(!["www.mercadolivre.com.br","mercadolivre.com.br"].includes(domain(source)))continue;
      const code=clean(row.codigo,40);
      if(!/^[A-Za-z0-9_-]{3,40}$/.test(code))continue;
      p.coupon=code;p.coupon_expiry=expiry;
    }
  }catch(_){/* Coupon feed failure never blocks product catalog. */}
  return products;
}
async function load() {
  let feedError=null;
  if(config.sheetFeedUrl?.startsWith("https://docs.google.com/spreadsheets/d/")) {
    try {
      const rows=parseGviz(await getText(config.sheetFeedUrl,config.feedTimeoutMs));
      const products=validRows(rows);
      if(!rows.length)throw Error("Empty published sheet");
      // An intentionally paused catalog may have zero active products.
      await attachVerifiedCoupons(products);
      return {products,source:"google_sheets",rowCount:rows.length,loadedAt:Date.now()};
    }catch(e){feedError=String(e.message||e)}
  }
  const res=JSON.parse(await getText(config.catalogUrl||"./achadinhos-v457/catalog.json",config.feedTimeoutMs));
  return {products:sanitizeStatic(res),source:"backup_estatico",feedError,loadedAt:Date.now()};
}
const currency=(n)=>typeof n==="number"&&Number.isFinite(n)?new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(n):null;
window.DeltaCatalog=Object.freeze({load,parseGviz,validRows,validMarketplace,currency,price,recent});
})();
