#!/bin/bash

# SimplyCodes Development Script

set -e

echo "🚀 Starting SimplyCodes in development mode..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
fi

# Build types package first (dependency for others)
echo "🔨 Building types package..."
pnpm --filter @simplycodes/types build

# Start development servers in parallel
echo "🏃 Starting development servers..."
pnpm run dev

echo "✅ Development servers running!"
echo "📍 Extension will auto-reload on changes"
echo "📍 Load the extension from: packages/extension/dist/"