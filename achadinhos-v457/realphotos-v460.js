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
 top.append($("span","studio-logo","✦ ACHADINHOS DA "+(window.DELTA_PRESENTER_PROFILE?.name||"LÍVIA").toUpperCase()),$("span","studio-gold-dot","✦"));
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
/* Evidence-based matching criteria; not product tests, rankings or promotions. */
const guideById=Object.freeze({
 "a5f926996780c1":{who:"Para preparar refeições na air fryer",verify:["Confira voltagem e capacidade útil","Meça o espaço disponível na bancada","Confira vendedor, frete e garantia"]},
 "6f87a43a0e641b":{who:"Para monitorar ambientes com câmera Wi-Fi",verify:["Confira uso interno/externo e alimentação","Veja as opções de gravação e aplicativo","Confira as configurações de privacidade"]},
 "808a0de1621ea5":{who:"Para secar e modelar cabelos em casa",verify:["Confira tensão elétrica e tomada","Veja acessórios e ajustes disponíveis","Confira orientações de segurança e garantia"]},
 "8a70cab203d8ed":{who:"Para organizar o Wi-Fi da sua casa",verify:["Confira cobertura e obstáculos do ambiente","Verifique portas e modo de operação","Confirme compatibilidade com seu provedor"]},
 "71637ee03633f8":{who:"Para distribuir Wi-Fi em vários ambientes",verify:["Verifique quantidade de módulos do kit","Confira portas e compatibilidade do roteador","Considere barreiras e a área a atender"]},
 "d5f6c3d6232827":{who:"Para ampliar o armazenamento de um PC compatível",verify:["Verifique suporte ao padrão M.2 NVMe","Confira formato e capacidade","Consulte garantia e condições do vendedor"]},
 "ca04b85b08fa13":{who:"Para perfurações e pequenos reparos",verify:["Confira material a perfurar e potência","Veja acessórios incluídos","Confirme voltagem e equipamentos de proteção"]},
 "0df53a0fc561e9":{who:"Para limpeza doméstica de pisos e superfícies",verify:["Confira superfícies permitidas","Veja filtros e acessórios incluídos","Confirme tensão, reservatório e garantia"]}
});
function buyerGuide(p){
 const exact=guideById[p?.id];
 if(exact)return exact;
 const common=({
  "Tecnologia":["Verifique compatibilidade e especificações do modelo","Confira conectividade e acessórios"],
  "Casa":["Confira voltagem, dimensões e capacidade","Veja instruções de limpeza e manutenção"],
  "Beleza":["Confira composição ou tensão conforme o produto","Veja acessórios e instruções do fabricante"],
  "Ferramentas":["Confira tensão, potência e acessórios","Verifique os materiais e equipamentos de proteção"],
  "Automotivo":["Verifique compatibilidade com o veículo","Confira potência, alimentação e segurança"],
  "Pets":["Confira tamanho e adequação ao seu pet","Veja limpeza, manutenção e peças de reposição"]
 })[p?.category] || ["Confira o modelo e as especificações","Verifique a adequação à sua necessidade"];
 return {who:null,verify:[...common,"Compare vendedor, preço, frete e garantia no anúncio"]};
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
 root.setAttribute("aria-busy","false");
 const selected=chooseSpotlight(products);
 for(const p of selected){
  const tile=$("article","studio-highlight-tile");
  const details=$("a","studio-highlight-detail");
  details.href=(window.DELTA_STORE_CONFIG?.detailPageUrl||"./produto.html")+"?id="+encodeURIComponent(p.id);
  details.setAttribute("aria-label","Ver detalhes e fotografias de "+p.title);
  details.append(artwork(p));
  const copy=$("div","studio-highlight-copy");
  copy.append($("span","studio-highlight-kicker",p.category||"Produtos"),
   $("strong","",p.title));
  const guide=buyerGuide(p);
  if(guide.who)copy.append($("span","studio-highlight-benefit",guide.who));
  copy.append($("span","studio-highlight-more","Ver detalhes e cuidados →"));
  details.append(copy);
  tile.append(details);
  if(p.affiliate_url && /^https:\/\/meli\.la\/[A-Za-z0-9]+$/.test(p.affiliate_url)){
    const buy=$("a","studio-highlight-buy","Preço no Mercado Livre ↗");
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
window.DeltaVisuals=Object.freeze({artwork,spotlight,actualPhoto,chooseSpotlight,buyerGuide});
})();
