#!/bin/bash
# Generate PWA icons for EmbedStudio
#
# Prerequisites:
#   1. Create a square SVG logo (or PNG at >= 512x512) as source
#   2. Install ImageMagick or sharp-cli: npm install -g sharp-cli
#
# Example using sharp-cli:
#   npx sharp-cli resize 192 192 --input public/icons/icon-source.svg --output public/icons/icon-192.png
#   npx sharp-cli resize 512 512 --input public/icons/icon-source.svg --output public/icons/icon-512.png
#
# Example using ImageMagick:
#   magick public/icons/icon-source.svg -resize 192x192 public/icons/icon-192.png
#   magick public/icons/icon-source.svg -resize 512x512 public/icons/icon-512.png

echo "Place your source icon (icon-source.svg or icon-source.png) in public/icons/ first."
echo "Then run the appropriate convert command above."
