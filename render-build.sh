#!/bin/sh
# DELTA Studio static build - runs on Render Linux build service.
# Copies a strict allowlist of nonpaid files and rewrites canonical metadata.
set -eu
: "${RENDER_EXTERNAL_URL:?Render must provide RENDER_EXTERNAL_URL at build time}"
PUBLIC_BASE="https://idelta775-hash.github.io/delta-produtos/"
TARGET_BASE="${RENDER_EXTERNAL_URL%/}/"
OUT="./render-dist"
rm -rf "$OUT"
mkdir -p "$OUT/assets"
for name in ofertas-de-parceiros.html produto.html index.html sistemas.html resposta-orcamento-gratis.html precificador.html celebre-junto.html conversa-pro.html conversa-demo-gratis.html caixa-em-ordem.html roteiros-originais.html roteiros-demo-gratis.html artes-pro.html modelos-atendimento-whatsapp.html calculadora-roi-gratis.html amostra-etiqueta-gratis.html guia-precificacao-automacao.html guia-festa-imprimivel.html reels-barber-pro.html ecossistema-sistemas.html guia-ia-negocios.html diagnostico-negocios.html systeme-io-negocios.html; do
  cp "$name" "$OUT/$name"
done
for name in style.css roi-gratis.js conversa-demo.js roteiros-demo.js roteiros-demo.css robots.txt sitemap.xml; do
  cp "$name" "$OUT/$name"
done
for image in assets/*.jpg; do
  cp "$image" "$OUT/assets/"
done
# Explicit safe allowlist: preview PDF only; never full paid books/ZIP.
cp "assets/caixa-ordem-previa.pdf" "$OUT/assets/"
cp "assets/roteiros-previa.pdf" "$OUT/assets/"
cp "assets/conversa-pro-reel.mp4" "$OUT/assets/"
cp "assets/conversa-pro-reel-pt.vtt" "$OUT/assets/"
cp "assets/reels-barber-demo.mp4" "$OUT/assets/"
cp "assets/delta-studio-orcamentos-comercial-original-v431.mp4" "$OUT/assets/"
cp "assets/delta-studio-orcamentos-comercial-v431.vtt" "$OUT/assets/"
cp "assets/delta-reels-barber-anuncio-24s.mp4" "$OUT/assets/"
cp "assets/reels-barber-demo.jpg" "$OUT/assets/"
cp "assets/delta-reels-barber-amostra-gratis.zip" "$OUT/assets/"
# Google Search Console ownership verification; publicly readable file.
cp "google74965e4ea9b20b4e.html" "$OUT/"

# Achadinhos da Livia V4.56: copy only audited static, non-secret files.
mkdir -p "$OUT/achadinhos-v456/assets"
for name in app.js config.js style.css catalog.json privacy.html; do
  cp "achadinhos-v456/$name" "$OUT/achadinhos-v456/$name"
done
cp "achadinhos-v456/assets/livia_duarte_presenter.jpg" "$OUT/achadinhos-v456/assets/"

# Achadinhos da Livia V4.57: offline fallback + live read-only Google Sheets.
mkdir -p "$OUT/achadinhos-v457/assets"
for name in app.js catalog-loader.js store-settings.js detail.js config.js style.css catalog.json privacy.html; do
  cp "achadinhos-v457/$name" "$OUT/achadinhos-v457/$name"
done
cp "achadinhos-v457/assets/livia_duarte_presenter.jpg" "$OUT/achadinhos-v457/assets/"
# Achadinhos da Livia V4.58: lightweight conversion/navigation assets only.
for name in commerce-v458.js commerce-v458.css favicon.svg; do
  cp "achadinhos-v457/$name" "$OUT/achadinhos-v457/$name"
done
# DELTA Affiliate V4.60 — exclusively real product photo references, no drawings or SVG illustrations.
for name in realphotos-v460.js realphotos-v460.css photo-sources-v460.js photos-v460.json; do
  cp "achadinhos-v457/$name" "$OUT/achadinhos-v457/$name"
done
# Achadinhos da Livia V4.61 conversion-first responsive CSS, no product imagery changes.
cp "achadinhos-v457/conversion-v461.css" "$OUT/achadinhos-v457/"
# Rewrite canonical, OpenGraph, sitemap and robots absolute URL to this site's real Render hostname.
for name in "$OUT"/*.html "$OUT"/sitemap.xml "$OUT"/robots.txt; do
  sed "s|${PUBLIC_BASE}|${TARGET_BASE}|g" "$name" > "$name.new"
  mv "$name.new" "$name"
done
# Fail closed if any GitHub Pages canonical/metadata URL was missed.
if grep -r "idelta775-hash.github.io/delta-produtos/" "$OUT" --include='*.html' --include='*.xml' --include='*.txt' > /dev/null 2>&1; then
  echo "ERROR: old canonical URL remains in Render output" 1>&2
  exit 1
fi
echo "DELTA_RENDER_BUILD_OK: public pages and marketing images only"
