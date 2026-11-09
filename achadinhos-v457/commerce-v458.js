/* Achadinhos da Lívia V4.58: preference-only favorites, voluntary sharing, verified-price filters. */
(() => {
"use strict";
const KEY="delta:livia:favorites:v1", prefix="https://delta-studio-d3wq.onrender.com";
const doc=document;
const $=id=>doc.getElementById(id);
let favoriteOnly=false, priceMin=null, priceMax=null, onlyVerified=false;
let storageOk=true;
function readIds() {
 try {
  const data=JSON.parse(localStorage.getItem(KEY)||"[]");
  if(Array.isArray(data))return new Set(data.filter(x=>typeof x==="string"&&/^[A-Za-z0-9_-]{6,80}$/.test(x)).slice(0,500));
 }catch(_){storageOk=false}
 return new Set();
}
let favorites=readIds();
const make=(tag,cls,text)=>{
 const e=doc.createElement(tag);
 if(cls)e.className=cls;
 if(text!==undefined)e.textContent=text;
 return e;
};
const money=x=>Number.isFinite(x)?new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(x):"";
function productPage(p){
 const url=new URL("produto.html",prefix+"/");
 url.searchParams.set("id",p.id);
 return url.href;
}
function refresh() {
 doc.dispatchEvent(new CustomEvent("delta:commerce"));
 const counter=$("favoritesCount");
 if(counter) counter.textContent=String(favorites.size);
 const btn=$("favoritesFilter");
 if(btn){btn.setAttribute("aria-pressed",String(favoriteOnly));btn.classList.toggle("is-active",favoriteOnly)}
 doc.querySelectorAll("[data-favorite-id]").forEach(b=>{
   const on=favorites.has(b.dataset.favoriteId);
   b.setAttribute("aria-pressed",String(on));
   b.setAttribute("aria-label",on?"Remover dos favoritos":"Salvar nos favoritos");
   b.textContent=on?"♥":"♡";
 });
}
function writeIds(){
 try {localStorage.setItem(KEY,JSON.stringify([...favorites].slice(0,500)));storageOk=true}
 catch(_){storageOk=false}
}
function toggleFavorite(p){
 if(favorites.has(p.id))favorites.delete(p.id);
 else if(favorites.size<500)favorites.add(p.id);
 writeIds();refresh();
}
function matches(p){
 if(favoriteOnly&&!favorites.has(p.id))return false;
 if((onlyVerified||priceMin!==null||priceMax!==null) && !Number.isFinite(p.price_brl))return false;
 if(priceMin!==null && p.price_brl<priceMin)return false;
 if(priceMax!==null && p.price_brl>priceMax)return false;
 return true;
}
function favoriteButton(p){
 const btn=make("button","favorite-toggle",favorites.has(p.id)?"♥":"♡");
 btn.type="button";btn.dataset.favoriteId=p.id;
 btn.setAttribute("aria-label",favorites.has(p.id)?"Remover dos favoritos":"Salvar nos favoritos");
 btn.setAttribute("aria-pressed",String(favorites.has(p.id)));
 btn.title="Salvar neste navegador";
 btn.addEventListener("click",()=>toggleFavorite(p));
 return btn;
}
function shareButton(p){
 const btn=make("button","share-product","Compartilhar");
 btn.type="button";btn.setAttribute("aria-label","Compartilhar página de "+p.title+" no WhatsApp");
 btn.addEventListener("click",()=>{
   const link=productPage(p);
   const msg="Olha esta indicação da Lívia: "+p.title+". Confira os detalhes e o anúncio original aqui: "+link+" (site com links de afiliado).";
   const url="https://api.whatsapp.com/send?text="+encodeURIComponent(msg);
   window.open(url,"_blank","noopener,noreferrer");
 });
 return btn;
}
function decorateCard(p){
 const row=make("div","commerce-card-tools");
 row.append(favoriteButton(p),shareButton(p));
 return row;
}
function appendDetail(p){
 const container=doc.querySelector(".detail-copy");
 if(!container)return;
 const panel=make("div","commerce-detail-tools");
 const fav=favoriteButton(p);fav.classList.add("favorite-detail");
 fav.append(doc.createTextNode(" Salvar favorito"));
 panel.append(fav,shareButton(p));
 container.insertBefore(panel,container.querySelector(".affiliate-note"));
}
function setFavoriteFilter(value){
 favoriteOnly=Boolean(value);
 refresh();
}
function parseNumber(value){
 if(!String(value||"").trim())return null;
 const n=Number(String(value).replace(",","."));
 return Number.isFinite(n)&&n>=0&&n<200000?n:null;
}
function applyFilter(){
 priceMin=parseNumber($("minPrice")?.value);
 priceMax=parseNumber($("maxPrice")?.value);
 if(priceMin!==null && priceMax!==null && priceMin>priceMax){
  const t=priceMin;priceMin=priceMax;priceMax=t;
  if($("minPrice"))$("minPrice").value=String(priceMin);
  if($("maxPrice"))$("maxPrice").value=String(priceMax);
 }
 onlyVerified=Boolean($("priceVerifiedOnly")?.checked);
 refresh();closePanel();
}
function clearFilter(){
 priceMin=null;priceMax=null;onlyVerified=false;
 if($("minPrice"))$("minPrice").value="";
 if($("maxPrice"))$("maxPrice").value="";
 if($("priceVerifiedOnly"))$("priceVerifiedOnly").checked=false;
 refresh();
}
function closePanel(){
 const panel=$("priceFilters");
 if(panel)panel.hidden=true;
 $("priceFilterToggle")?.setAttribute("aria-expanded","false");
}
function closeMobileMenu(){
 const m=$("mobileNav");
 if(m)m.hidden=true;
 $("mobileMenuToggle")?.setAttribute("aria-expanded","false");
}
function init(){
 $("favoritesFilter")?.addEventListener("click",()=>setFavoriteFilter(!favoriteOnly));
 $("priceFilterToggle")?.addEventListener("click",()=>{
  const p=$("priceFilters");
  if(!p)return;
  p.hidden=!p.hidden;
  $("priceFilterToggle").setAttribute("aria-expanded",String(!p.hidden));
  if(!p.hidden) $("minPrice")?.focus();
 });
 $("applyPriceFilters")?.addEventListener("click",applyFilter);
 $("clearPriceFilters")?.addEventListener("click",clearFilter);
 $("closePriceFilters")?.addEventListener("click",closePanel);
 $("priceFilters")?.addEventListener("keydown",e=>{if(e.key==="Enter")applyFilter()});
 $("mobileMenuToggle")?.addEventListener("click",()=>{
   const m=$("mobileNav");
   m.hidden=!m.hidden;
   $("mobileMenuToggle").setAttribute("aria-expanded",String(!m.hidden));
 });
 $("mobileNav")?.querySelectorAll("a").forEach(a=>a.addEventListener("click",closeMobileMenu));
 $("mobileMenuClose")?.addEventListener("click",closeMobileMenu);
 doc.addEventListener("keydown",e=>{if(e.key==="Escape"){closePanel();closeMobileMenu()}});
 $("backToTop")?.addEventListener("click",()=>window.scrollTo({top:0,behavior:window.matchMedia("(prefers-reduced-motion:reduce)").matches?"auto":"smooth"}));
 window.addEventListener("scroll",()=>{
   const btn=$("backToTop");
   if(btn)btn.hidden=window.scrollY<500;
 },{passive:true});
 $("headerSearch")?.addEventListener("click",()=>{
   doc.querySelector("#catalogo")?.scrollIntoView({behavior:"smooth"});
   $("searchInput")?.focus({preventScroll:true});
 });
 doc.addEventListener("delta:detail-ready",e=>appendDetail(e.detail?.product));
 refresh();
}
window.DeltaCommerce=Object.freeze({matches,decorateCard,favoriteButton,shareButton,appendDetail,favoriteCount:()=>favorites.size,refresh,getFavoriteOnly:()=>favoriteOnly,has:id=>favorites.has(id)});
if(doc.readyState==="loading")doc.addEventListener("DOMContentLoaded",init,{once:true});
else init();
})();
