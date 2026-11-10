(() => {
"use strict";
const config=window.DELTA_STORE_CONFIG||{};
const cat=window.DeltaCatalog;
const id=new URLSearchParams(location.search).get("id");
const root=document.querySelector("#productDetail");
const related=document.querySelector("#relatedGrid");
const text=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;e.textContent=String(value||"");return e};
const link=(href,label,cls)=>{const a=text("a",cls,label);a.href=href;return a};
const palette={"Tecnologia":"💻","Casa":"🏠","Beleza":"✨","Pets":"🐾","Ferramentas":"🛠️","Automotivo":"🚘"};
function safeId(v){return typeof v==="string"&&/^[A-Za-z0-9_-]{6,80}$/.test(v)}
function renderProduct(p){
  root.replaceChildren();
  document.title=p.title+" | Achadinhos da Lívia";
  const back=link("./ofertas-de-parceiros.html","← Voltar para os achadinhos","back-link");
  const layout=text("div","detail-layout");
  const art=text("div","detail-art");
  if(window.DeltaVisuals) art.append(window.DeltaVisuals.artwork(p,true));
  else art.append(text("span","detail-art-emoji",palette[p.category]||"✦"));
  const copy=text("div","detail-copy");
  copy.append(text("span","detail-category",p.category+" · "+p.marketplace));
  copy.append(text("h1","",p.title));
  copy.append(text("p","detail-explanation",p.description||"Confira a descrição e as condições no anúncio original."));
  const box=text("div","detail-price");
  const formatted=cat.currency(p.price_brl);
  box.append(text("small","",formatted?"Preço informado na última verificação":"Preço e condições atuais"));
  box.append(text("strong","",formatted||"Confira no marketplace"));
  if(p.old_price_brl&&p.old_price_brl>p.price_brl) {
     box.append(text("span","old-price","Preço anterior observado: "+cat.currency(p.old_price_brl)));
  }
  if(p.coupon)box.append(text("span","coupon-value","Cupom informado: "+p.coupon+" · confira as regras"));
  box.append(text("p","notice","O valor, o frete, o estoque, o cupom e o vendedor podem mudar. Confirme tudo antes de comprar."));
  const buy=link(p.affiliate_url,"Ver anúncio e comprar no "+p.marketplace+" ↗","detail-buy");
  buy.target="_blank";buy.rel="sponsored nofollow noopener noreferrer";
  const note=text("p","affiliate-note","Publicidade/afiliação: a DELTA pode receber comissão por compras qualificadas, sem custo adicional para você.");
  const checks=text("div","detail-checks");
  checks.append(text("h2","","Antes de comprar, confira:"));
  const list=document.createElement("ul");
  const guide=window.DeltaVisuals?.buyerGuide?.(p);
  if(guide?.who)checks.append(text("p","buyer-fit","Pode ser útil: "+guide.who.replace(/^Para /,"").replace(/^para /,"")));
  const criteria=guide?.verify || ["Confira as especificações e compatibilidade com sua necessidade"];
  for(const item of [...criteria,"Confira preço, vendedor, avaliações, frete e devolução no anúncio original"])
    list.append(text("li","",item));
  checks.append(list);
  copy.append(box,buy,note,checks);layout.append(art,copy);
  root.append(back,layout);
}
function renderRelated(items,main){
  related.replaceChildren();
  const candidates=items.filter(x=>x.id!==main.id&&x.category===main.category).slice(0,4);
  if(!candidates.length){document.querySelector("#relatedSection").hidden=true;return}
  for(const p of candidates){
    const a=link("./produto.html?id="+encodeURIComponent(p.id),"","related-card");
    a.append(text("span","related-emoji",palette[p.category]||"✦"),text("strong","",p.title),text("small","", "Ver informações →"));
    related.append(a);
  }
}
async function main(){
  try{
    if(!safeId(id))throw Error("Produto inválido");
    const data=await cat.load();
    if(window.DeltaStoreSettings) await window.DeltaStoreSettings.load();
    const p=data.products.find(x=>x.id===id);
    if(!p || window.DELTA_CATEGORY_META?.[p.category]?.active===false)throw Error("Produto indisponível ou em revisão");
    renderProduct(p);renderRelated(data.products,p);
    document.dispatchEvent(new CustomEvent("delta:detail-ready",{detail:{product:p}}));
    document.querySelector("#syncStatus").textContent=data.source==="google_sheets"?"Informações sincronizadas com o catálogo":"Catálogo de segurança — confirme os detalhes no marketplace";
  }catch(e){
    root.replaceChildren(text("h1","","Produto indisponível"),text("p","","Este produto pode ter sido removido ou pausado na nossa curadoria."),link("./ofertas-de-parceiros.html","Voltar à vitrine","detail-buy"));
    document.querySelector("#relatedSection").hidden=true;
  }
}
main();
})();
