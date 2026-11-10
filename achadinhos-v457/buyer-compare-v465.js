/* Achadinhos V4.65 — comparação consciente entre produtos, sem avaliações, preços ou dados inventados. */
(()=>{
"use strict";
const selected=new Set();
let catalog=new Map();
const byId=id=>document.getElementById(id);
const maxItems=3;
const e=(tag,cls,content)=>{
 const node=document.createElement(tag);
 if(cls)node.className=cls;
 if(content!==undefined)node.textContent=String(content);
 return node;
};
const safePhoto=p=>{
 try{
  const pic=window.DeltaVisuals?.actualPhoto(p);
  if(!pic)return null;
  const url=new URL(pic.url);
  return url.protocol==="https:" ? pic.url : null;
 }catch(_){return null}
};
const modelNeeds=p=>window.DeltaVisuals?.buyerGuide?.(p)||{who:"Escolha conforme sua necessidade.",verify:["Confirme especificações e compatibilidade","Compare preço, prazo, vendedor e garantia no marketplace"]};
function syncUI(){
 const count=selected.size;
 const tray=byId("compareTray");
 if(tray)tray.hidden=count===0;
 const num=byId("compareCount");if(num)num.textContent=String(count);
 const open=byId("compareOpen");if(open)open.disabled=count<2;
 const message=byId("compareMessage");
 if(message)message.textContent=count<2?"Escolha mais um produto para comparar.":count+" produtos escolhidos. Compare informações antes de abrir os anúncios.";
 document.querySelectorAll("[data-compare-id]").forEach(btn=>{
  const on=selected.has(btn.dataset.compareId);
  btn.setAttribute("aria-pressed",String(on));
  btn.textContent=on?"✓ Comparando":"⇄ Comparar";
  btn.title=on?"Retirar da comparação":"Incluir na comparação";
 });
}
function button(p){
 const b=e("button","compare-select","⇄ Comparar");
 b.type="button";b.dataset.compareId=p.id;
 b.setAttribute("aria-label","Comparar "+p.title+" com outros produtos");
 b.setAttribute("aria-pressed",String(selected.has(p.id)));
 b.addEventListener("click",()=>{
  const notice=byId("compareNotice");
  if(notice)notice.textContent="";
  if(selected.has(p.id))selected.delete(p.id);
  else if(selected.size>=maxItems){
   if(notice)notice.textContent="Você pode comparar até 3 produtos de cada vez.";
   const tray=byId("compareTray");if(tray)tray.hidden=false;
   return;
  } else selected.add(p.id);
  syncUI();
 });
 return b;
}
function detailCard(p){
 const card=e("article","compare-result-card");
 const photo=e("div","compare-result-photo");
 const url=safePhoto(p);
 if(url){
  const img=document.createElement("img");
  const pending=e("p","compare-no-photo","Carregando fotografia do modelo…");
  photo.append(pending);
  img.referrerPolicy="no-referrer";img.loading="eager";img.decoding="async";
  img.alt="Fotografia de referência do modelo "+p.title;
  img.onload=()=>{if(img.naturalWidth>=100){pending.remove();}else{img.onerror();}};
  img.onerror=()=>{img.remove();pending.textContent="Confira a foto real no anúncio original";};
  img.src=url;
  photo.append(img);
 }else photo.append(e("p","compare-no-photo","Fotografia disponível no anúncio original"));
 const category=e("span","compare-category",p.category+" · "+p.marketplace);
 const name=e("h3","",p.title);
 const desc=e("p","compare-description",p.description||"Confirme as características no anúncio original.");
 const guide=modelNeeds(p);
 const title=e("strong","compare-guide-title","Para quem faz sentido");
 const who=e("p","compare-who",guide.who||"Confira se este modelo atende à sua necessidade.");
 const checks=e("ul","compare-checks");
 for(const item of (guide.verify||[]).slice(0,3))checks.append(e("li","",item));
 const price=e("p","compare-price",Number.isFinite(p.price_brl)?
  "Preço observado: "+window.DeltaCatalog.currency(p.price_brl)+" · confirme no anúncio":
  "Preço atual: consultar no Mercado Livre");
 const detail=e("a","compare-detail","Ver detalhes no Achadinhos");
 detail.href="./produto.html?id="+encodeURIComponent(p.id);
 const buy=e("a","compare-market","Conferir no Mercado Livre ↗");
 buy.href=p.affiliate_url;buy.target="_blank";buy.rel="sponsored nofollow noopener noreferrer";
 buy.setAttribute("aria-label","Ver preço e condições de "+p.title+" no Mercado Livre");
 card.append(photo,category,name,desc,title,who,checks,price,detail,buy);
 return card;
}
function openComparison(){
 const modal=byId("compareDialog");
 if(!modal || selected.size<2)return;
 const content=byId("compareItems");
 content.replaceChildren();
 for(const id of selected){
  const product=catalog.get(id);
  if(product)content.append(detailCard(product));
 }
 const count=content.children.length;
 if(count<2){syncUI();return}
 if(typeof modal.showModal==="function") modal.showModal();
 else modal.hidden=false;
}
function init(){
 byId("compareOpen")?.addEventListener("click",openComparison);
 byId("compareClear")?.addEventListener("click",()=>{selected.clear();const n=byId("compareNotice");if(n)n.textContent="";syncUI()});
 byId("compareClose")?.addEventListener("click",()=>byId("compareDialog")?.close());
 byId("compareDialog")?.addEventListener("click",event=>{
  if(event.target===event.currentTarget)event.currentTarget.close();
 });
 syncUI();
}
function updateCatalog(products){
 catalog=new Map(products.filter(p=>p&&p.id).map(p=>[p.id,p]));
 for(const id of Array.from(selected))if(!catalog.has(id))selected.delete(id);
 syncUI();
}
window.DeltaCompare=Object.freeze({decorateCard:button,updateCatalog});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
else init();
})();