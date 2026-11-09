window.DELTA_STORE_CONFIG = Object.freeze({
  brand: "Achadinhos da Lívia",
  catalogUrl: "./achadinhos-v457/catalog.json",
  sheetFeedUrl: "https://docs.google.com/spreadsheets/d/1yBz3nO3GMUQfroe3O6j3c4_b5CiJvpR5orc5ymMgOT4/gviz/tq?tqx=out:json&headers=1&sheet=Produtos",
  detailPageUrl: "./produto.html",
  storeFeedUrl: "https://docs.google.com/spreadsheets/d/1yBz3nO3GMUQfroe3O6j3c4_b5CiJvpR5orc5ymMgOT4/gviz/tq?tqx=out:json&headers=1&sheet=Loja",
  categoryFeedUrl: "https://docs.google.com/spreadsheets/d/1yBz3nO3GMUQfroe3O6j3c4_b5CiJvpR5orc5ymMgOT4/gviz/tq?tqx=out:json&headers=1&sheet=Categorias",
  couponFeedUrl: "https://docs.google.com/spreadsheets/d/1yBz3nO3GMUQfroe3O6j3c4_b5CiJvpR5orc5ymMgOT4/gviz/tq?tqx=out:json&headers=1&sheet=Cupons",
  batchSize: 12,
  feedTimeoutMs: 9000,
  syncIntervalMinutes: 5,
  priceFreshnessHours: 48,
  maxRows: 3000,
  enabledMarketplaces: Object.freeze({"Mercado Livre": Object.freeze({hostname:"meli.la",pathPattern:"^/[A-Za-z0-9]+$"})}),
  imageHosts: Object.freeze(["http2.mlstatic.com","http2.mlstatic.com.br","m.media-amazon.com","down-br.img.susercontent.com"]),
  affiliateDisclosure: "Podemos receber comissão por compras qualificadas, sem custo adicional para você.",
  ownerSheet: "https://docs.google.com/spreadsheets/d/1yBz3nO3GMUQfroe3O6j3c4_b5CiJvpR5orc5ymMgOT4/edit",
  mode: "PUBLIC_LIVE_SHEET_WITH_COMPLIANCE_GATES"
});
