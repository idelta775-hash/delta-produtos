/* DELTA Affiliate V4.59: branded visual merchandising layer.
   Vector scenes are original editorial ILLUSTRATIONS, never exact photos of SKUs.
   Verified/licensed real product photographs take visual priority when present. */
(() => {
"use strict";
const sprite="./achadinhos-v457/assets/editorial/products-v459.svg";
const $=(tag,cls,content)=>{
 const el=document.createElement(tag);
 if(cls)el.className=cls;
 if(content!==undefined)el.textContent=String(content);
 return el;
};
const norm=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const rule=[
 [/air.?fryer|fritadeira/, "airfryer"],
 [/robo.*aspir|aspirador.*robo/, "vacuum"],
 [/aspirador/, "vacuum"],
 [/smartwatch|watch|relogio.*smart/, "watch"],
 [/escova secadora|escova.*model|escova.*rotativa/, "brush"],
 [/furadeira|parafusadeira/, "drill"],
 [/camera|c.mera|seguranca ip|mibo/, "camera"],
 [/roteador|mesh|deco x|mercusys/, "router"],
 [/notebook|galaxy book/, "laptop"],
 [/\bssd\b|nvme/, "ssd"],
 [/iphone|samsung galaxy|motorola moto|celular|smartphone/, "phone"],
 [/smart tv|televisao|\btv\b/, "tv"],
 [/monitor/, "monitor"],
 [/fone|earbud|soundcore/, "earbuds"],
 [/playstation|\bps5\b|console/, "console"],
 [/jbl|boombox|caixa de som/, "speaker"],
 [/perfume|colonia|insensatez|desodorante/, "perfume"],
 [/elseve|oleo extraordinario|cicaplast|baume|cosmetico|creme/, "cosmetic"],
 [/oneblade|barbeador|aparador/, "shaver"],
 [/fonte de agua|bebedouro/, "fountain"],
 [/compressor|car air pump|bomba de ar/, "toolcase"],
 [/soprador|kit.*ferramentas/, "toolcase"],
 [/suporte.*celular/, "phone"],
 [/pulverizador|snow foam/, "bottle"],
 [/kit silicone|panela|cozinha/, "toolcase"],
 [/refletor|super led/, "monitor"],
 [/varal/, "toolcase"],
 [/escova facial/, "brush"]
];
const fallback={Tecnologia:"phone",Casa:"airfryer",Beleza:"cosmetic",Ferramentas:"drill",Pets:"fountain",Automotivo:"toolcase"};
function kind(p){
 const name=norm(p?.title);
 for(const [re,value] of rule)if(re.test(name))return value;
 return fallback[p?.category]||"generic";
}
function facts(p){
 // Only extract text that already occurs in the verified product title.
 const title=String(p?.title||"");
 const values=[];
 const regex=/\b\d+(?:[.,]\d+)?\s?(?:GB|TB|MB|MP|W|L|mAh|peças|pcs|unidades|polegadas|Hz)\b/gi;
 for(const m of title.matchAll(regex)) {
  const value=m[0].replace(/\s+/g," ").trim().slice(0,13);
  if(!values.includes(value))values.push(value);
  if(values.length>=2)break;
 }
 return values;
}
function vector(p) {
 const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
 svg.setAttribute("viewBox","0 0 480 360");
 svg.setAttribute("role","img");
 svg.setAttribute("aria-label","Ilustração genérica da categoria do produto, não uma fotografia da mercadoria anunciada.");
 svg.classList.add("studio-vector");
 const use=document.createElementNS("http://www.w3.org/2000/svg","use");
 use.setAttribute("href",sprite+"#"+kind(p));
 svg.append(use);
 return svg;
}
function photo(p){
 if(p?.image_publication_license!=="approved_for_public_marketing" || !p?.image_url)return null;
 try {
  const u=new URL(p.image_url);
  const hosts=window.DELTA_STORE_CONFIG?.imageHosts||[];
  if(u.protocol!=="https:"||u.username||u.password||!hosts.includes(u.hostname))return null;
  const img=$("img","studio-photo");
  img.src=u.href;img.alt="Fotografia autorizada: "+p.title;img.loading="lazy";
  img.decoding="async";
  return img;
 }catch(_){return null;}
}
function artwork(p,large=false){
 const fig=$("figure","studio-art"+(large?" studio-art-large":""));
 fig.dataset.archetype=kind(p);
 fig.dataset.category=p.category||"Outros";
 fig.dataset.productId=p.id||"";
 const top=$("div","studio-topline");
 top.append($("span","studio-logo","✦ ACHADINHOS DA LÍVIA"),$("span","studio-gold-dot","✦"));
 const scene=$("div","studio-scene");
 const halo=$("div","studio-halo");
 halo.setAttribute("aria-hidden","true");
 scene.append(halo,vector(p));
 const pic=photo(p);
 const note=$("span","studio-photo-label",pic?"Foto autorizada":"Imagem ilustrativa");
 if(pic){
  pic.onerror=()=>{pic.remove();note.textContent="Imagem ilustrativa";};
  scene.append(pic);
 }
 const foot=$("div","studio-footer");
 const category=$("span","studio-category",p.category||"Curadoria");
 const detail=$("span","studio-disclosure","Confira o modelo real no anúncio ↗");
 foot.append(category,detail);
 const extras=facts(p);
 if(extras.length){
  const labels=$("div","studio-title-facts");
  for(const s of extras)labels.append($("span","studio-fact",s));
  scene.append(labels);
 }
 fig.append(top,scene,note,foot);
 return fig;
}
function chooseSpotlight(products){
 const sets=[
  p=>/air.?fryer|fritadeira/i.test(p.title),
  p=>/camera|c.mera/i.test(p.title),
  p=>/escova secadora/i.test(p.title),
  p=>/ssd|roteador|notebook/i.test(p.title)
 ];
 const chosen=[];const used=new Set();
 for(const test of sets){
  const p=products.find(x=>!used.has(x.id)&&test(x));
  if(p){chosen.push(p);used.add(p.id);}
 }
 for(const p of products){if(chosen.length>=4)break;if(!used.has(p.id)){chosen.push(p);used.add(p.id);}}
 return chosen;
}
function spotlight(products){
 const root=document.getElementById("studioHighlights");
 if(!root)return;
 root.replaceChildren();
 for(const p of chooseSpotlight(products)) {
  const link=$("a","studio-highlight-tile");
  link.href="./produto.html?id="+encodeURIComponent(p.id);
  link.setAttribute("aria-label","Ver detalhes de "+p.title);
  link.append(artwork(p));
  const box=$("div","studio-highlight-copy");
  box.append($("span","studio-highlight-kicker",p.category||"Achadinho"),$("strong","",p.title),$("span","studio-highlight-more","Conhecer o produto ↗"));
  link.append(box);
  root.append(link);
 }
 const section=document.getElementById("studioSection");
 if(section)section.hidden=products.length===0;
}
window.DeltaVisuals=Object.freeze({artwork,kind,facts,spotlight});
})();
