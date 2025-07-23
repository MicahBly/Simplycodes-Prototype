#!/bin/bash
# Simple script to generate placeholder icons
# In production, replace with actual SimplyCodes branding

for size in 16 32 48 128; do
  echo "Creating icon-${size}.png"
  # Create a simple colored square as placeholder
  convert -size ${size}x${size} xc:'#0ea5e9' \
    -gravity center -pointsize $((size/3)) \
    -fill white -annotate +0+0 'SC' \
    icon-${size}.png 2>/dev/null || echo "Install ImageMagick to generate icons"
done