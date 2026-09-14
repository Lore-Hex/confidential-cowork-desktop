#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
icons=icons/trusted-cowork
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
mkdir "$tmp/app.iconset"
for size in 16 32 48 64 128 256 512; do
  rsvg-convert -w "$size" -h "$size" "$icons/icon.svg" > "$icons/icon-$size.png"
done
for size in 16 32 128 256 512; do
  rsvg-convert -w "$size" -h "$size" "$icons/icon.svg" > "$tmp/app.iconset/icon_${size}x${size}.png"
  double=$((size * 2))
  rsvg-convert -w "$double" -h "$double" "$icons/icon.svg" > "$tmp/app.iconset/icon_${size}x${size}@2x.png"
done
iconutil -c icns "$tmp/app.iconset" -o "$icons/icon.icns"
cp "$icons/icon-512.png" "$icons/icon.png"
cp "$icons/icon-512.png" "$icons/dock.png"
