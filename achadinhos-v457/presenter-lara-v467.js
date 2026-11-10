(() => {
"use strict";
const old = window.DELTA_STORE_CONFIG;
if (!old || !old.sheetFeedUrl || !old.catalogUrl) return;
window.DELTA_PRESENTER_PROFILE=Object.freeze({
  id:"lara",name:"Lara",home:"./ofertas-da-lara.html",detail:"./produto-lara.html"
});
window.DELTA_STORE_CONFIG=Object.freeze({
  ...old,
  brand:"Achadinhos da Lara",
  detailPageUrl:"./produto-lara.html",
  homePageUrl:"./ofertas-da-lara.html"
});
})();
