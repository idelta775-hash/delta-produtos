/* DELTA V4.74 — same-store theme links + gated, official affiliate lists.
 * No external marketplace discovery, API calls, fictitious product links or traffic.
 * The "collections" here use ONLY approved products already in the shared catalog.
 */
(() => {
  "use strict";
  const $=id=>document.getElementById(id);
  const cfg=window.DELTA_STORE_CONFIG||{};
  const normalize=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
  const plain=s=>String(s||"").slice(0,170);
  const el=(tag,cls,t)=>{
    const o=document.createElement(tag);
    if(cls)o.className=cls;
    if(t!==undefined)o.textContent=String(t);
    return o;
  };
  let products=[];
  const approvedCategory=p=>window.DELTA_CATEGORY_META?.[p?.category]?.active!==false;
  function linkForCategory(name){
    const u=new URL(location.pathname,location.origin);
    u.searchParams.set("categoria",name);
    u.hash="catalogo";
    return u.href;
  }
  function renderThemes(){
    const target=$("themeCollectionsGrid"),panel=$("themeCollections");
    if(!panel||!target)return;
    target.replaceChildren();
    const counts=new Map();
    for(const p of products){
      if(!approvedCategory(p)||!p.category)continue;
      counts.set(p.category,(counts.get(p.category)||0)+1);
    }
    for(const [category,num] of [...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],"pt-BR"))){
      const card=el("article","theme-collection");
      card.append(el("h3","",category));
      card.append(el("p","",num+" produto"+(num===1?"":"s")+" desta loja"));
      const actions=el("div","theme-collection-actions");
      const go=el("a","theme-collection-go","Explorar →");
      go.href=linkForCategory(category);
      const copy=el("button","theme-collection-copy","Copiar link");
      copy.type="button";
      copy.setAttribute("aria-label","Copiar link da coleção "+category);
      copy.addEventListener("click",async()=>{
        const url=linkForCategory(category);
        const feedback=$("themeCollectionsFeedback");
        try{
          if(!navigator.clipboard||!navigator.clipboard.writeText)throw Error("clipboard_unavailable");
          await navigator.clipboard.writeText(url);
          if(feedback)feedback.textContent="Link da coleção "+category+" copiado.";
        }catch(_){
          if(feedback)feedback.textContent="Copie o endereço da coleção no campo exibido abaixo.";
          const field=$("themeCollectionsManualCopy");
          if(field){field.hidden=false;field.value=url;field.focus();field.select();}
        }
      });
      actions.append(go,copy);
      card.append(actions);
      target.append(card);
    }
    panel.hidden=counts.size===0;
    if($("themeCollectionsCount"))$("themeCollectionsCount").textContent=counts.size+" coleções da loja";
  }
  function isApprovedOfficialList(v){
    if(!v||typeof v!=="object")return false;
    if(v.kind!=="mercado_livre_official_affiliate_list" || v.public_release!==true ||
        v.owner_verified!==true || v.public_list_verified!==true ||
        v.destination_verified!==true || v.channel_verified!==true ||
        v.link_generated_in_official_portal!==true || typeof v.title!=="string" ||
        v.title.trim().length<4 || typeof v.url!=="string")return false;
    try{
      const u=new URL(v.url);
      if(u.protocol!=="https:"||u.username||u.password||u.hash||
         !["meli.la","www.mercadolivre.com.br","mercadolivre.com.br"].includes(u.hostname))return false;
      if(u.pathname==="/"||/^\/(?:ofertas|mais-vendidos|lista\.mercadolivre|categorias|search|sites|carrinho)(?:\/|$)/i.test(u.pathname))return false;
      const stamp=Date.parse(String(v.last_verified_at||""));
      if(!Number.isFinite(stamp)||stamp>Date.now() || Date.now()-stamp>7*86400000)return false;
      return true;
    }catch(_){return false;}
  }
  async function loadOfficialLists(){
    const panel=$("officialAffiliateLists"),target=$("officialAffiliateListsGrid");
    if(!panel||!target)return;
    try{
      const response=await fetch("./achadinhos-v457/affiliate-lists-v474.json",{cache:"no-store",credentials:"omit"});
      if(!response.ok)throw Error("missing");
      const data=await response.json();
      if(data?.schema!=="delta-affiliate-official-lists-v474"||!Array.isArray(data.lists))return;
      const seen=new Set();
      const allowed=data.lists.filter(x=>{
        if(!isApprovedOfficialList(x)||seen.has(x.url))return false;
        seen.add(x.url);return true;
      }).slice(0,24);
      target.replaceChildren();
      for(const item of allowed){
        const entry=el("article","official-affiliate-list");
        entry.append(el("h3","",plain(item.title)));
        entry.append(el("p","","Lista pública do Mercado Livre. Confira produtos, preço e disponibilidade ao abrir."));
        const a=el("a","official-affiliate-list-link","Ver lista oficial →");
        a.href=item.url;a.target="_blank";a.rel="sponsored nofollow noopener noreferrer";
        entry.append(a);target.append(entry);
      }
      panel.hidden=allowed.length===0;
    }catch(_){panel.hidden=true;}
  }
  const api=Object.freeze({
    updateCatalog(list){products=Array.isArray(list)?list.filter(p=>p&&p.id&&p.affiliate_url):[];renderThemes();},
    urlForCategory:linkForCategory,
    isApprovedOfficialList,
    reloadOfficialLists:loadOfficialLists,
    visibleThemeCount:()=>new Set(products.filter(approvedCategory).map(p=>p.category)).size
  });
  window.DeltaCollections=api;
  loadOfficialLists();
})();