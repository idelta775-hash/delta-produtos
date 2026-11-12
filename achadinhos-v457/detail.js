(() => {
"use strict";
const config=window.DELTA_STORE_CONFIG||{};
const cat=window.DeltaCatalog;
const id=new URLSearchParams(location.search).get("id")||document.querySelector('meta[name="delta-product-id"]')?.content;
const root=document.querySelector("#productDetail");
const related=document.querySelector("#relatedGrid");
const text=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;e.textContent=String(value||"");return e};
const link=(href,label,cls)=>{const a=text("a",cls,label);a.href=href;return a};
const palette={"Tecnologia":"💻","Casa":"🏠","Beleza":"✨","Pets":"🐾","Ferramentas":"🛠️","Automotivo":"🚘"};
function safeId(v){return typeof v==="string"&&/^[A-Za-z0-9_-]{6,80}$/.test(v)}
function shareBox(p) {
  // User-initiated sharing of the DELTA detail page; NEVER copies or opens
  // affiliate links automatically, and NEVER inherits tracking from an ad.
  const box=text("div","delta-product-share");
  const button=text("button","delta-share-action","Compartilhar este achado");
  button.type="button";
  const message=text("p","delta-share-feedback","");
  message.setAttribute("role","status");
  message.setAttribute("aria-live","polite");
  const fallback=text("input","delta-share-fallback");
  fallback.type="text";fallback.readOnly=true;fallback.hidden=true;
  fallback.setAttribute("aria-label","Link para copiar manualmente");
  const staticId=document.querySelector('meta[name="delta-product-id"]')?.content;
  const url=new URL(staticId===p.id?location.pathname:(config.detailPageUrl||"./produto.html"),location.href);
  url.search="";url.hash="";if(staticId!==p.id)url.searchParams.set("id",p.id);
  const shareUrl=url.href;
  button.addEventListener("click",async()=>{
    const data={
      title:p.title+" | "+(config.brand||"Achadinhos DELTA"),
      text:"Veja este produto na nossa loja. Publicidade: podemos receber comissão por compras elegíveis. Preço e disponibilidade devem ser confirmados no anúncio.",
      url:shareUrl
    };
    try {
      if(typeof navigator.share==="function") {
        await navigator.share(data);
        message.textContent="Compartilhamento aberto no dispositivo.";
        return;
      }
      if(navigator.clipboard && typeof navigator.clipboard.writeText==="function") {
        await navigator.clipboard.writeText(data.text+" "+shareUrl);
        message.textContent="Texto e link do produto copiados. Cole na rede ou conversa que desejar.";
        return;
      }
      throw Error("copy_not_supported");
    }catch(e) {
      if(e&&e.name==="AbortError") {
        message.textContent="Compartilhamento cancelado.";
        return;
      }
      fallback.hidden=false;fallback.value=data.text+" "+shareUrl;fallback.focus();fallback.select();
      message.textContent="Selecione e copie o texto acima para compartilhar manualmente.";
    }
  });
  box.append(button,message,fallback);
  return box;
}
function purchaseJourney() {
  const sec=text("section","delta-purchase-journey");
  sec.setAttribute("aria-label","Como funciona a compra");
  sec.append(text("h2","","Como funciona sua compra"));
  const steps=document.createElement("ol");
  const content=[
    ["Compare na DELTA","Consulte o modelo, as informações e os cuidados de compra nesta página."],
    ["Escolha abrir o anúncio","Só ao clicar voluntariamente no botão de compra você vai ao anúncio do Mercado Livre."],
    ["Finalize no marketplace","Confira vendedor, preço, estoque, frete, prazo e devolução no Mercado Livre antes de pagar."]
  ];
  for(const [title,desc] of content){
    const li=document.createElement("li");
    li.append(text("strong","",title),text("p","",desc));
    steps.append(li);
  }
  sec.append(steps);
  sec.append(text("p","delta-purchase-clarification","A DELTA apresenta recomendações e links de afiliado. Não recebe pagamentos neste site e não é a vendedora do produto. Podemos receber comissão por compras elegíveis."));
  return sec;
}
function mountMobilePurchaseShortcut(p,buy) {
  // Original and duplicate CTA use the SAME confirmed affiliate link.
  // No automatic navigation, tracking, click simulation or invented discount.
  const bar=text("aside","delta-mobile-purchase-v490");
  bar.setAttribute("aria-label","Atalho de compra voluntária");
  const notice=text("span","delta-mobile-purchase-note-v490",
    "Publicidade · Confira preço, vendedor e frete no anúncio original.");
  const cta=link(p.affiliate_url,"Ver no "+p.marketplace+" ↗",
    "delta-mobile-purchase-button-v490");
  cta.target="_blank";
  cta.rel="sponsored nofollow noopener noreferrer";
  cta.setAttribute("aria-label","Abrir voluntariamente o anúncio deste produto em "+p.marketplace);
  bar.append(notice,cta);
  root.append(bar);
  const body=document.body;
  body.classList.add("delta-mobile-purchase-active-v490");
  if(typeof IntersectionObserver==="function"){
    const watcher=new IntersectionObserver(entries=>{
      const visible=entries.some(entry=>entry.isIntersecting);
      bar.classList.toggle("is-inactive-v490",visible);
      body.classList.toggle("delta-mobile-purchase-active-v490",!visible);
    },{threshold:.15});
    watcher.observe(buy);
  }
}
function renderProduct(p){
  root.replaceChildren();
  document.title=p.title+" | "+(config.brand||"Achadinhos da Lívia");
  const back=link(config.homePageUrl||"./ofertas-de-parceiros.html","← Voltar para os achadinhos","back-link");
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
  copy.append(box,buy,shareBox(p),note,purchaseJourney(),checks);layout.append(art,copy);
  root.append(back,layout);
  mountMobilePurchaseShortcut(p,buy);
}
function renderRelated(items,main){
  related.replaceChildren();
  const candidates=items.filter(x=>x.id!==main.id&&x.category===main.category).slice(0,4);
  if(!candidates.length){document.querySelector("#relatedSection").hidden=true;return}
  for(const p of candidates){
    const a=link((config.detailPageUrl||"./produto.html")+"?id="+encodeURIComponent(p.id),"","related-card");
    const source=window.DeltaVisuals?.actualPhoto(p);
    const media=text("div","related-media");
    if(source){
      const photo=document.createElement("img");
      photo.src=source.url;photo.alt="Fotografia de referência do modelo "+p.title;
      photo.loading="lazy";photo.decoding="async";photo.referrerPolicy="no-referrer";
      photo.onerror=()=>{photo.remove();media.replaceChildren(text("span","related-no-photo","Confira a foto real no anúncio"))};
      media.append(photo);
    }else{
      media.append(text("span","related-no-photo","Foto real no anúncio original"));
    }
    a.append(media,text("strong","",p.title),text("small","", "Ver detalhes e cuidados →"));
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
    root.replaceChildren(text("h1","","Produto indisponível"),text("p","","Este produto pode ter sido removido ou pausado na nossa curadoria."),link(config.homePageUrl||"./ofertas-de-parceiros.html","Voltar à vitrine","detail-buy"));
    document.querySelector("#relatedSection").hidden=true;
  }
}
main();
})();
