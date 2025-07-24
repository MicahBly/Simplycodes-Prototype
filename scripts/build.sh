#!/bin/bash

# SimplyCodes Build Script

set -e

echo "🚀 Building SimplyCodes Extension..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
pnpm run clean

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build all packages
echo "🔨 Building packages..."
pnpm run build

# Copy public assets
echo "📁 Copying public assets..."
cp -r packages/extension/public/icons packages/extension/dist/

# Create models directory
echo "🤖 Creating models directory..."
mkdir -p packages/extension/dist/models

# Download models (placeholder - in production, download actual models)
echo "📥 Model download instructions:"
echo "  1. Download TinyLlama ONNX model from: https://example.com/tinyllama.onnx"
echo "  2. Download XGBoost ranker from: https://example.com/ranker.onnx"
echo "  3. Place them in: packages/extension/dist/models/"

# Create extension package
echo "📦 Creating extension package..."
cd packages/extension/dist
zip -r ../simplycodes-extension.zip ./*
cd ../../..

echo "✅ Build complete!"
echo "📍 Extension package: packages/extension/simplycodes-extension.zip"
echo "📍 Unpacked extension: packages/extension/dist/"