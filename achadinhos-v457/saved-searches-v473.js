/* V4.73 — Busca acompanhada: preferências ficam SOMENTE no navegador.
 * Sem login, conta, coleta remota, cookies, notificações ou promessas de promoções.
 * A mesma loja (Lívia/Lara) compartilha as buscas no mesmo domínio.
 */
(() => {
"use strict";
const KEY="delta_achadinhos_saved_queries_v473";
const LIMIT=8;
const $=id=>document.getElementById(id);
const normalize=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g," ").trim();
const clean=s=>String(s||"").replace(/[\u0000-\u001f<>]/g,"").replace(/\s+/g," ").trim().slice(0,80);
const store={
  read(){
    try{
      const v=JSON.parse(localStorage.getItem(KEY)||"[]");
      if(!Array.isArray(v))return [];
      const seen=new Set();
      return v.filter(x=>{
        if(!x||typeof x.query!=="string")return false;
        x.query=clean(x.query);
        const k=normalize(x.query);
        if(k.length<2||seen.has(k))return false;
        seen.add(k);return true;
      }).slice(0,LIMIT).map(x=>({query:x.query,seen:Array.isArray(x.seen)?x.seen.filter(v=>typeof v==="string").slice(0,100):[]}));
    }catch(_){return [];}
  },
  write(list){
    try{localStorage.setItem(KEY,JSON.stringify(list.slice(0,LIMIT)));return true;}catch(_){return false;}
  }
};
let products=[],liveQuery="",results=0,loaded=false;
function match(p,q){
  const text=normalize([p.title,p.category,p.description,p.group,p.subtitle].join(" "));
  const terms=normalize(q).split(" ").filter(Boolean);
  return terms.length>0&&terms.every(t=>text.includes(t));
}
function relatedIds(q){
  return products.filter(p=>p?.id&&p?.affiliate_url&&match(p,q)).map(p=>String(p.id)).slice(0,100);
}
function el(name,cls,text){
  const x=document.createElement(name);
  if(cls)x.className=cls;
  if(text!==undefined)x.textContent=text;
  return x;
}
function save(q){
  const query=clean(q);
  if(normalize(query).length<2)return false;
  const entries=store.read().filter(e=>normalize(e.query)!==normalize(query));
  entries.unshift({query,seen:relatedIds(query)});
  const done=store.write(entries);
  render();
  return done;
}
function render(){
  const wrapper=$("savedQueries"),items=$("savedQueriesList"),trigger=$("saveSearchBtn");
  if(trigger){
    const can=loaded&&normalize(liveQuery).length>=2&&results===0;
    trigger.hidden=!can;
    trigger.disabled=!can;
  }
  if(!wrapper||!items)return;
  const saved=store.read();
  wrapper.hidden=saved.length===0;
  items.replaceChildren();
  for(const item of saved){
    const row=el("div","saved-query");
    const label=el("button","saved-query-go",item.query);
    label.type="button";
    const matching=relatedIds(item.query);
    const previously=new Set(item.seen);
    const newCount=matching.filter(id=>!previously.has(id)).length;
    const detail=el("span","saved-query-result",loaded?
      (newCount>0?newCount+" novidade"+(newCount===1?"":"s")+" no catálogo":matching.length+" produto"+(matching.length===1?"":"s")+" correspondente"+(matching.length===1?"":"s")):
      "Consultar ao carregar");
    label.addEventListener("click",()=>{
      const search=$("searchInput");
      if(!search)return;
      search.value=item.query;
      search.dispatchEvent(new Event("input",{bubbles:true}));
      $("catalogo")?.scrollIntoView({behavior:"smooth",block:"start"});
      search.focus({preventScroll:true});
    });
    const rm=el("button","saved-query-remove","Remover");
    rm.type="button";rm.setAttribute("aria-label","Remover a busca por "+item.query);
    rm.addEventListener("click",()=>{
      store.write(store.read().filter(x=>normalize(x.query)!==normalize(item.query)));
      render();
    });
    row.append(label,detail,rm);
    items.append(row);
  }
  const note=$("savedQueriesNote");
  if(note)note.textContent="Salvas somente neste navegador. Confira novamente quando quiser; não enviamos alertas.";
}
const saveBtn=$("saveSearchBtn");
saveBtn?.addEventListener("click",()=>{
  if(save(liveQuery)){
    const feedback=$("savedQueriesFeedback");
    if(feedback)feedback.textContent="Busca guardada neste navegador. Você pode consultá-la nas duas vitrines.";
  }else{
    const feedback=$("savedQueriesFeedback");
    if(feedback)feedback.textContent="Não foi possível armazenar. Você ainda pode continuar pesquisando.";
  }
});
$("clearSavedQueries")?.addEventListener("click",()=>{store.write([]);render();});
window.addEventListener("storage",e=>{if(e.key===KEY)render();});
window.DeltaSavedQueries=Object.freeze({
  updateCatalog(list){
    products=Array.isArray(list)?list.filter(p=>p&&p.id&&typeof p.title==="string"):[];loaded=true;render();
  },
  onRender(q,count){liveQuery=clean(q);results=Number(count)||0;render();},
  save, getCount:()=>store.read().length,
  getSaved:()=>store.read().map(x=>x.query)
});
render();
})();
