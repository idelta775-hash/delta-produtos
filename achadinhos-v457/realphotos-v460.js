/* DELTA AFFILIATE — real-product-photo-only presentation V4.60.
 * No SVGs, product drawings, generated mock products, or generic placeholders.
 * Published sources are visually matched named-model photos and recorded in photos-v460.json.
 * A product without a checked photo is presented as text-only, never as a drawing.
 */
(() => {
"use strict";
const $=(tag,cls,content)=>{
 const e=document.createElement(tag);
 if(cls)e.className=cls;
 if(content!==undefined)e.textContent=String(content);
 return e;
};
const sources=window.DeltaPhotoSources||Object.create(null);
const officialHosts=(window.DELTA_STORE_CONFIG?.imageHosts||[]);
const validUrl=raw=>{
 try{
  const u=new URL(raw);
  return u.protocol==="https:" && !u.username && !u.password && !u.hash;
 }catch(_){return false;}
};
function actualPhoto(p){
 if(p?.image_publication_license==="approved_for_public_marketing" && p?.image_url && validUrl(p.image_url)){
   try{
    if(officialHosts.includes(new URL(p.image_url).hostname))
      return {url:p.image_url,origin:"planilha_verificada",model:p.title,rights:"aprovada_na_planilha"};
   }catch(_){}
 }
 const item=sources[p?.id];
 if(item && validUrl(item.url) && item.model && item.source_page && validUrl(item.source_page)){
  return {url:item.url,origin:"foto_modelo_referencia",model:item.model,rights:item.rights};
 }
 return null;
}
function artwork(p,large=false){
 const fig=$("figure","studio-art real-photo-art"+(large?" studio-art-large":""));
 fig.dataset.productId=p?.id||"";
 const top=$("div","studio-topline");
 top.append($("span","studio-logo","✦ ACHADINHOS DA LÍVIA"),$("span","studio-gold-dot","✦"));
 const frame=$("div","studio-photo-frame");
 const source=actualPhoto(p);
 if(source){
   const img=$("img","actual-product-photo");
   img.src=source.url;
   img.alt="Fotografia real do modelo "+p.title+". Confirme o modelo, a cor e os itens no anúncio.";
   img.loading=large?"eager":"lazy";
   img.decoding="async";
   img.referrerPolicy="no-referrer";
   img.onerror=()=>{
     img.remove();
     frame.classList.add("no-photo");
     frame.append($("p","no-photo-message","Consulte a fotografia original no anúncio"));
     const label=fig.querySelector(".studio-photo-label");
     if(label)label.textContent="Foto indisponível";
     fig.dataset.photoLoaded="no";
   };
   img.onload=()=>{
     if(img.naturalWidth>=100&&img.naturalHeight>=100)fig.dataset.photoLoaded="yes";
     else img.onerror();
   };
   frame.append(img);
   fig.dataset.photoSource=source.origin;
   fig.dataset.photoLoaded="loading";
 } else {
   frame.classList.add("no-photo");
   frame.append($("p","no-photo-message","Veja as fotos reais no anúncio original"));
   fig.dataset.photoLoaded="no";
 }
 const note=$("span","studio-photo-label",source?"Fotografia do modelo":"Foto disponível no anúncio");
 const foot=$("div","studio-footer");
 foot.append($("span","studio-category",p.category||"Produtos"),
   $("span","studio-disclosure","Confira modelo e condições no anúncio ↗"));
 fig.append(top,frame,note,foot);
 return fig;
}
function chooseSpotlight(products){
 const order=[
 "a5f926996780c1", // Midea air fryer
 "6f87a43a0e641b", // Intelbras iM5SC
 "808a0de1621ea5", // Britânia BEC07
 "8a70cab203d8ed" // Mercusys MR30G
 ];
 const available=products.filter(p=>actualPhoto(p));
 const chosen=[];const seen=new Set();
 for(const id of order){
  const p=available.find(x=>x.id===id);
  if(p&&!seen.has(id)){chosen.push(p);seen.add(id);}
 }
 for(const p of available){
  if(chosen.length>=4)break;
  if(!seen.has(p.id)){chosen.push(p);seen.add(p.id);}
 }
 return chosen;
}
function spotlight(products){
 const root=document.getElementById("studioHighlights");
 const section=document.getElementById("studioSection");
 if(!root)return;
 root.replaceChildren();
 const selected=chooseSpotlight(products);
 for(const p of selected){
  const tile=$("article","studio-highlight-tile");
  const details=$("a","studio-highlight-detail");
  details.href="./produto.html?id="+encodeURIComponent(p.id);
  details.setAttribute("aria-label","Ver detalhes e fotografias de "+p.title);
  details.append(artwork(p));
  const copy=$("div","studio-highlight-copy");
  copy.append($("span","studio-highlight-kicker",p.category||"Produtos"),
   $("strong","",p.title),$("span","studio-highlight-more","Ver detalhes →"));
  details.append(copy);
  tile.append(details);
  if(p.affiliate_url && /^https:\/\/meli\.la\/[A-Za-z0-9]+$/.test(p.affiliate_url)){
    const buy=$("a","studio-highlight-buy","Conferir preço ↗");
    buy.href=p.affiliate_url;
    buy.target="_blank";
    buy.rel="sponsored nofollow noopener noreferrer";
    buy.setAttribute("aria-label","Conferir preço e condições de "+p.title+" no Mercado Livre");
    tile.append(buy);
  }
  root.append(tile);
 }
 if(section)section.hidden=selected.length===0;
}
window.DeltaVisuals=Object.freeze({artwork,spotlight,actualPhoto,chooseSpotlight});
})();
