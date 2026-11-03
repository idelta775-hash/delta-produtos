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
for name in index.html precificador.html celebre-junto.html calculadora-roi-gratis.html amostra-etiqueta-gratis.html guia-precificacao-automacao.html guia-festa-imprimivel.html; do
  cp "$name" "$OUT/$name"
done
for name in style.css roi-gratis.js robots.txt sitemap.xml; do
  cp "$name" "$OUT/$name"
done
for image in assets/*.jpg; do
  cp "$image" "$OUT/assets/"
done
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
