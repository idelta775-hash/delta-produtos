/* DELTA Deals V4.68 — promotion verification gates.
 * NO purchase tracking, no fake offers, no external search calls, no affiliate-link creation.
 * Same shared catalog for Lara and Livia; independent editorial pages.
 */
(() => {
  "use strict";
  const $=id=>document.getElementById(id);
  const config=window.DELTA_STORE_CONFIG||{};
  const safeText=(v)=>String(v==null?"":v).slice(0,250);
  const normalize=v=>safeText(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
  const validLink=v=>{
    try{
      const u=new URL(v);
      return u.protocol==="https:"&&u.hostname==="meli.la"&&/^\/[A-Za-z0-9]+$/.test(u.pathname)&&
        !u.search&&!u.hash&&!u.username&&!u.password;
    }catch(_){return false;}
  };
  const el=(tag,cls,value)=>{
    const o=document.createElement(tag); if(cls)o.className=cls;
    if(value!==undefined)o.textContent=String(value); return o;
  };
  const money=v=>window.DeltaCatalog?.currency(v)||"Consulte no Mercado Livre";
  const fresh=p=>{
    if(!p.last_verified_at||!Number.isFinite(p.price_brl)||p.price_brl<=0)return false;
    return window.DeltaCatalog?.recent?.(p.last_verified_at,Number(config.priceFreshnessHours||48))===true;
  };
  const couponActive=p=>{
    if(!fresh(p)||!p.coupon||!/^[-_A-Za-z0-9]{3,40}$/.test(p.coupon))return false;
    const expires=String(p.coupon_expiry||"");
    if(!/^\d{4}-\d{2}-\d{2}$/.test(expires))return false;
    return new Date(expires+"T23:59:59-03:00").getTime()>Date.now();
  };
  const observedLower=p=>fresh(p)&&Number.isFinite(p.old_price_brl)&&p.old_price_brl>p.price_brl;
  const score=p=>{
    // Promotional recommendation only with source conditions; no fake discount.
    if(couponActive(p))return 2;
    if(observedLower(p))return 1;
    return 0;
  };
  const discountInfo=p=>{
    if(couponActive(p)) return {kind:"cupom",label:"Cupom registrado • confira elegibilidade"};
    if(observedLower(p))return {kind:"historico",label:"Preço atual abaixo do preço anterior informado"};
    return null;
  };
  let products=[],query="";
  const status=$("dealStatus"),cards=$("dealCards"),preview=$("dealSearchResults"),counter=$("dealCounter");
  const words=v=>new Set(normalize(v).split(/[^a-z0-9]+/).filter(x=>x.length>1));
  function relevant(p,q){
    if(!q)return 1;
    const title=normalize(p.title),others=normalize([p.description,p.category].join(" "));
    if(title.includes(q))return 100;
    const list=[...words(q)];if(!list.length)return 0;
    const hits=list.filter(w=>title.includes(w)||others.includes(w)).length;
    return hits===list.length?60+hits:(hits?hits:0);
  }
  function sortRanked(source,q){
    return source.map(p=>({p,r:relevant(p,q)})).filter(x=>!q||x.r>0)
     .sort((a,b)=> b.r-a.r || score(b.p)-score(a.p) ||
       ((Number.isFinite(a.p.price_brl)?a.p.price_brl:Infinity)-(Number.isFinite(b.p.price_brl)?b.p.price_brl:Infinity)) ||
       a.p.title.localeCompare(b.p.title,"pt-BR")).map(x=>x.p);
  }
  function card(p){
    const wrap=el("article","deal-card");
    const kind=discountInfo(p);
    const pic=el("div","deal-picture");
    const photo=window.DeltaVisuals?.actualPhoto?.(p);
    if(photo && /^https:\/\//.test(photo.url)){
      const img=el("img","",undefined);
      img.src=photo.url;img.alt="Fotografia verificada do produto "+safeText(p.title);
      img.loading="lazy";img.decoding="async";img.referrerPolicy="no-referrer";
      img.addEventListener("error",()=>{img.remove();pic.append(el("span","deal-photo-fallback","Confira a foto do modelo no anúncio original"));});
      pic.append(img);
    }else pic.append(el("span","deal-photo-fallback","Foto oficial no anúncio original"));
    wrap.append(pic);
    const body=el("div","deal-info");
    body.append(el("small","deal-category",p.category));
    body.append(el("h3","",p.title));
    if(kind)body.append(el("p","deal-evidence",kind.label));
    if(fresh(p)){
      body.append(el("strong","deal-price",money(p.price_brl)));
      const when=p.last_verified_at?.slice(0,10).split("-").reverse().join("/")||"";
      body.append(el("small","deal-checked","Preço consultado em "+when+". Confirme no anúncio."));
    }else body.append(el("p","deal-unknown-price","Preço atual: consulte no Mercado Livre"));
    if(couponActive(p))body.append(el("small","deal-coupon","Cupom informado: "+p.coupon+" • sujeito às regras da oferta"));
    if(validLink(p.affiliate_url)){
      const link=el("a","deal-buy","Ver preço atual no Mercado Livre ↗");
      link.href=p.affiliate_url;link.target="_blank";link.rel="sponsored nofollow noopener noreferrer";
      link.setAttribute("aria-label","Ver preço atual de "+p.title+" no Mercado Livre");body.append(link);
    }
    wrap.append(body);return wrap;
  }
  function render(){
    if(!cards||!status)return;
    cards.replaceChildren();
    const eligible=products.filter(p=>validLink(p.affiliate_url)&&score(p)>0)
      .sort((a,b)=>score(b)-score(a) ||
          ((Number.isFinite(a.price_brl)?a.price_brl:Infinity)-(Number.isFinite(b.price_brl)?b.price_brl:Infinity)));
    eligible.slice(0,6).forEach(p=>cards.append(card(p)));
    if(counter)counter.textContent=eligible.length+" oportunidade"+(eligible.length===1?"":"s")+" com informação recente";
    if(!eligible.length){
      cards.append(el("p","deal-empty","Ainda não há desconto ou cupom com evidência recente na nossa seleção. Não mostramos promoções inventadas."));
      status.textContent="Monitorando o catálogo compartilhado. Os valores são atualizados quando há nova verificação na fonte.";
    }else{
      status.textContent="Condições observadas recentemente no catálogo. Cupons podem ter elegibilidade e estoque limitados; confirme antes da compra.";
    }
    renderSearch();
  }
  function renderSearch(){
    if(!preview)return;
    preview.replaceChildren();
    if(!query){preview.hidden=true;return;}
    preview.hidden=false;
    const match=sortRanked(products.filter(p=>validLink(p.affiliate_url)),query);
    const heading=el("strong","deal-search-heading",match.length+" resultado"+(match.length===1?"":"s")+" em nosso catálogo verificado para “"+query.slice(0,60)+"”");
    preview.append(heading);
    if(!match.length){
      preview.append(el("p","deal-search-none","Ainda não encontramos esse produto entre as ofertas cadastradas. Estamos ampliando a seleção; não exibimos links ou preços não verificados."));
      return;
    }
    const best=el("div","deal-results");
    match.slice(0,4).forEach(p=>best.append(card(p)));
    preview.append(best);
    preview.append(el("p","deal-search-footnote","Pesquisa nesta loja de afiliados. Ainda não é uma consulta a todos os anúncios do Mercado Livre."));
  }
  const api=Object.freeze({
    update(list){
      // Only product objects coming from the already verified catalog loader.
      const ids=new Set();
      products=(Array.isArray(list)?list:[]).filter(p=>{
        if(!p?.id||ids.has(p.id)||!validLink(p.affiliate_url))return false;
        ids.add(p.id);return true;
      });
      render();
    },
    search(value){query=safeText(value).trim().slice(0,80);renderSearch();},
    getSummary(){return {count:products.length,promoCandidates:products.filter(p=>score(p)>0).length,query};}
  });
  window.DeltaDeals=api;
  if(products.length===0&&status)status.textContent="Carregando produtos e cupons com dados verificados…";
})();
