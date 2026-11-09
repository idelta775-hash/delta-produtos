(() => {
  "use strict";
  const config = window.DELTA_STORE_CONFIG || {};
  const allowedHosts = new Set(config.approvedAffiliateHosts || ["meli.la"]);
  const icons = Object.freeze({
    "Tecnologia": "💻", "Casa": "🏠", "Beleza": "✨",
    "Pets": "🐾", "Ferramentas": "🛠️", "Automotivo": "🚘", "Outros": "✦"
  });
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
    for (const item of state.products) counts.set(item.category, (counts.get(item.category) || 0) + 1);
    const categories = ["Todos", ...Array.from(counts.keys()).sort((a,b)=>a.localeCompare(b,"pt-BR"))];
    for (const name of categories) {
      const btn = elem("button", "cat-btn");
      btn.type = "button";
      btn.setAttribute("aria-pressed", String(state.category === name));
      const symbol = elem("span", "", name === "Todos" ? "✦" : (icons[name] || "✦"));
      symbol.setAttribute("aria-hidden", "true");
      btn.append(symbol, document.createTextNode(name === "Todos" ? "Todos" : name));
      const number = elem("span", "", String(name === "Todos" ? state.products.length : counts.get(name)));
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
      (state.category === "Todos" || p.category === state.category) &&
      (!q || normalize([p.title, p.category, p.description, p.subtitle, p.group].join(" ")).includes(q))
    );
    if (state.sort === "az") filtered.sort((a,b)=>a.title.localeCompare(b.title,"pt-BR"));
    if (state.sort === "category") filtered.sort((a,b)=>a.category.localeCompare(b.category,"pt-BR") || a.title.localeCompare(b.title,"pt-BR"));
    return filtered;
  }
  function makeCard(product) {
    const article = elem("article", "product-card");
    const art = elem("div", "product-art");
    art.dataset.category = product.category || "Outros";
    const tag = elem("span", "market-chip", product.marketplace || "Marketplace");
    const symbol = elem("span", "emoji", icons[product.category] || "✦");
    symbol.setAttribute("aria-hidden","true");
    art.append(tag, symbol);
    // Product imagery is NOT displayed until rights for public marketing are evidenced.
    if (product.image_publication_license === "approved_for_public_marketing" && product.image_url) {
      try {
        const u = new URL(product.image_url);
        if (u.protocol === "https:" && !u.username && !u.password) {
          const img = elem("img", "licensed-image");
          img.src = u.href;
          img.alt = product.title;
          img.loading = "lazy";
          img.addEventListener("error", () => img.remove());
          art.append(img);
        }
      } catch (_) { /* leave original category artwork */ }
    }
    const body = elem("div", "product-body");
    const label = elem("span", "item-category", product.category || "Outros");
    const title = elem("h3", "", product.title);
    const description = elem("p", "description", product.description || "Confira as especificações e condições no anúncio oficial.");
    const spacer = elem("div", "product-spacer");
    const notice = elem("div", "price-notice");
    notice.append(elem("span", "", "ⓘ"), document.createTextNode("Preço e estoque: consulte o anúncio"));
    const link = elem("a", "item-cta");
    link.href = product.affiliate_url;
    link.target = "_blank";
    link.rel = "sponsored nofollow noopener noreferrer";
    link.setAttribute("aria-label", "Conferir " + product.title + " no Mercado Livre");
    link.append(elem("span", "", "Conferir no Mercado Livre"), elem("span", "external", "↗"));
    body.append(label,title,description,spacer,notice,link);
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
  }
  async function init() {
    try {
      const response = await fetch(config.catalogUrl || "./catalog.json", {cache: "no-store"});
      if (!response.ok) throw new Error("HTTP " + response.status);
      const data = await response.json();
      if (!data || !Array.isArray(data.products)) throw new Error("Formato de catálogo inválido");
      const seen = new Set();
      state.products = data.products.filter(item => {
        if (!item || !item.title || !validAffiliateUrl(item.affiliate_url) || seen.has(item.affiliate_url)) return false;
        seen.add(item.affiliate_url);
        return true;
      });
      categoryButtons();
      render();
    } catch (err) {
      grid.setAttribute("aria-busy", "false");
      grid.replaceChildren(elem("p", "loading", "O catálogo está temporariamente indisponível. Atualize a página ou tente novamente mais tarde."));
      count.textContent = "Não foi possível carregar";
      pills.replaceChildren();
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
})();
