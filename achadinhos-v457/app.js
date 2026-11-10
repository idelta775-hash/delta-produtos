(() => {
  "use strict";
  const config = window.DELTA_STORE_CONFIG || {};
  const allowedHosts = new Set(config.approvedAffiliateHosts || ["meli.la"]);
  const icons = {
    "Tecnologia": "💻", "Casa": "🏠", "Beleza": "✨",
    "Pets": "🐾", "Ferramentas": "🛠️", "Automotivo": "🚘", "Outros": "✦"
  };
  const allowedCategory = p => window.DELTA_CATEGORY_META?.[p.category]?.active !== false;
  function applyMetadata() {
    for (const [name,value] of Object.entries(window.DELTA_CATEGORY_META||{}))
      if(value?.symbol) icons[name]=value.symbol;
  }
  const state = { products: [], category: "Todos", query: "", sort: "curation", visible: config.batchSize || 12 };
  const $ = (id) => document.getElementById(id);
  const grid = $("productGrid");
  const count = $("catalogCount");
  const pills = $("categoryPills");
  const more = $("moreBtn");
  const empty = $("emptyState");
  const search = $("searchInput");
  const sort = $("sortSelect");

  function normalize(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }
  function validAffiliateUrl(raw) {
    try {
      const url = new URL(String(raw));
      return url.protocol === "https:" && allowedHosts.has(url.hostname.toLowerCase()) &&
             /^\/[a-zA-Z0-9]+$/.test(url.pathname) && !url.username && !url.password &&
             !url.search && !url.hash;
    } catch (_) { return false; }
  }
  function elem(name, className, text) {
    const el = document.createElement(name);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function categoryButtons() {
    pills.replaceChildren();
    const counts = new Map();
    for (const item of state.products.filter(allowedCategory)) counts.set(item.category, (counts.get(item.category) || 0) + 1);
    const meta=window.DELTA_CATEGORY_META||{};
    const categories = ["Todos", ...Array.from(counts.keys()).sort((a,b)=>(meta[a]?.order||99)-(meta[b]?.order||99)||a.localeCompare(b,"pt-BR"))];
    for (const name of categories) {
      const btn = elem("button", "cat-btn");
      btn.type = "button";
      btn.setAttribute("aria-pressed", String(state.category === name));
      const symbol = elem("span", "", name === "Todos" ? "✦" : (icons[name] || "✦"));
      symbol.setAttribute("aria-hidden", "true");
      btn.append(symbol, document.createTextNode(name === "Todos" ? "Todos" : name));
      const number = elem("span", "", String(name === "Todos" ? Array.from(counts.values()).reduce((a,b)=>a+b,0) : counts.get(name)));
      number.style.fontSize = "10px";
      number.style.color = "#8da0b7";
      btn.append(number);
      btn.addEventListener("click", () => {
        state.category = name;
        state.visible = config.batchSize || 12;
        categoryButtons();
        render();
      });
      pills.append(btn);
    }
  }
  function visibleProducts() {
    const q = normalize(state.query.trim());
    const filtered = state.products.filter(p =>
      allowedCategory(p) && (!window.DeltaCommerce || window.DeltaCommerce.matches(p)) && (state.category === "Todos" || p.category === state.category) &&
      (!q || normalize([p.title, p.category, p.description, p.subtitle, p.group].join(" ")).includes(q))
    );
    if (state.sort === "az") filtered.sort((a,b)=>a.title.localeCompare(b.title,"pt-BR"));
    if (state.sort === "featured") filtered.sort((a,b)=>Number(Boolean(b.featured))-Number(Boolean(a.featured)));
    if (state.sort === "category") filtered.sort((a,b)=>a.category.localeCompare(b.category,"pt-BR") || a.title.localeCompare(b.title,"pt-BR"));
    return filtered;
  }
  function makeCard(product) {
    const article = elem("article", "product-card");
    const art = window.DeltaVisuals ? window.DeltaVisuals.artwork(product) : elem("div", "product-art");
    if(!window.DeltaVisuals) art.append(elem("span","emoji",icons[product.category] || "✦"));
    const body = elem("div", "product-body");
    const label = elem("span", "item-category", product.category || "Outros");
    const title = elem("h3", "", product.title);
    const description = elem("p", "description", product.description || "Confira as especificações e condições no anúncio oficial.");
    const guide=window.DeltaVisuals?.buyerGuide?.(product);
    const reason=guide?.who ? elem("p","product-reason","Para quem: "+guide.who.replace(/^Para /,"").replace(/^para /,"")) : null;
    const spacer = elem("div", "product-spacer");
    const notice = elem("div", "price-notice");
    const knownPrice = window.DeltaCatalog.currency(product.price_brl);
    notice.append(elem("span", "", "ⓘ"), document.createTextNode(knownPrice ? "Preço observado: " + knownPrice + " · confirme no anúncio" : "Preço e estoque: consulte o anúncio"));
    const link = elem("a", "item-cta");
    link.href = product.affiliate_url;
    link.target = "_blank";
    link.rel = "sponsored nofollow noopener noreferrer";
    link.setAttribute("aria-label", "Conferir " + product.title + " no Mercado Livre");
    link.append(elem("span", "", "Conferir no " + product.marketplace), elem("span", "external", "↗"));
    const details = elem("a","product-detail-link","Ver detalhes do produto →");
    details.href = (config.detailPageUrl || "./produto.html") + "?id=" + encodeURIComponent(product.id);
    details.setAttribute("aria-label","Detalhes de "+product.title);
    body.append(label,title,description);
    if(reason)body.append(reason);
    body.append(spacer,notice,details);
    if (window.DeltaCommerce) body.append(window.DeltaCommerce.decorateCard(product));
    body.append(link);
    article.append(art,body);
    return article;
  }
  function render() {
    const products = visibleProducts();
    count.textContent = products.length + (products.length === 1 ? " produto encontrado" : " produtos encontrados");
    grid.replaceChildren();
    for (const p of products.slice(0,state.visible)) grid.append(makeCard(p));
    grid.setAttribute("aria-busy", "false");
    empty.hidden = products.length !== 0;
    more.hidden = products.length <= state.visible;
    if (products.length === 0) grid.append(elem("p", "loading", "Sua busca não encontrou produtos nesta seleção."));
    if(window.DeltaVisuals) window.DeltaVisuals.spotlight(state.products.filter(allowedCategory));
  }
  async function init() {
    try {
      const data = await window.DeltaCatalog.load();
      const seen = new Set();
      state.products = data.products.filter(item => {
        if (!item || !item.title || !validAffiliateUrl(item.affiliate_url) || seen.has(item.affiliate_url)) return false;
        seen.add(item.affiliate_url);
        return true;
      });
      applyMetadata();
      const canFilterPrice=state.products.some(p=>Number.isFinite(p.price_brl));
      const filterButton=$("priceFilterToggle");
      if(filterButton){
        filterButton.hidden=!canFilterPrice;
        if(!canFilterPrice){
          const panel=$("priceFilters");
          if(panel)panel.hidden=true;
          filterButton.setAttribute("aria-expanded","false");
        }
      }
      if(state.category !== "Todos" && !state.products.some(p => allowedCategory(p) && p.category===state.category)) state.category = "Todos";
      categoryButtons();
      render();
      const sync = $("syncStatus");
      if (sync) sync.textContent = data.source==="google_sheets" ? "✓ Catálogo sincronizado pela planilha Google" : "Catálogo de segurança disponível · atualização da planilha temporariamente indisponível";
    } catch (err) {
      grid.setAttribute("aria-busy", "false");
      grid.replaceChildren(elem("p", "loading", "O catálogo está temporariamente indisponível. Atualize a página ou tente novamente mais tarde."));
      count.textContent = "Não foi possível carregar";
      pills.replaceChildren();
      const studio=$("studioSection");
      if(studio)studio.hidden=true;
      console.error("Falha no catálogo:", err.message);
    }
  }
  search.addEventListener("input", (event) => {
    state.query = event.target.value;
    state.visible = config.batchSize || 12;
    render();
  });
  sort.addEventListener("change", event => {
    state.sort = event.target.value;
    render();
  });
  more.addEventListener("click", () => {
    state.visible += config.batchSize || 12;
    render();
  });
  $("resetBtn").addEventListener("click", () => {
    state.category="Todos"; state.query=""; search.value="";
    state.visible=config.batchSize || 12;
    categoryButtons();render();
  });
  init();
  document.addEventListener("delta:commerce", () => { state.visible=config.batchSize || 12; render(); });
  document.addEventListener("delta:storemeta", () => { applyMetadata();categoryButtons();render(); });
  const refreshMillis = Math.max(2, Number(config.syncIntervalMinutes || 5)) * 60000;
  window.setInterval(() => { if (!document.hidden) init(); }, refreshMillis);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) init(); });
})();
