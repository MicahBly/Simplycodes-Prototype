# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SimplyCodes is a privacy-first browser extension that uses local AI (WebGPU + ONNX Runtime) to find and apply coupon codes. All ML inference runs client-side.

## Build and Development Commands

```bash
# Install dependencies
pnpm install

# Development mode (watches all packages)
pnpm dev

# Production build
pnpm build

# Run tests
pnpm test          # Unit tests
pnpm test:e2e      # E2E tests with Cypress

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Build specific package
pnpm --filter @simplycodes/extension build

# Clean build artifacts
pnpm clean
```

## Architecture Overview

### Monorepo Structure
- `/packages/extension` - Chrome/Edge extension (React + Vite + TailwindCSS)
- `/packages/web-llm` - ONNX Runtime wrapper for WebGPU inference
- `/packages/shared-mock-data` - Mock datasets and API simulation
- `/packages/types` - Shared TypeScript definitions
- `/tests` - Jest unit tests and Cypress E2E tests

### Key Technologies
- **Frontend**: React 18, TailwindCSS, Zustand
- **Build**: Vite, pnpm workspaces, TypeScript
- **ML/AI**: ONNX Runtime Web, WebGPU, TinyLlama 1.1B, XGBoost
- **Extension**: Chrome Manifest V3, Service Workers

### Important Patterns

1. **Privacy-First Design**
   - All ML runs locally via WebGPU/WASM
   - Only anonymized merchant hashes sent externally
   - No user tracking or analytics

2. **Message Passing Architecture**
   ```typescript
   // Content Script → Service Worker → ML Runtime
   chrome.runtime.sendMessage({ type: 'GET_COUPONS', payload: {...} })
   ```

3. **Progressive Model Loading**
   - Models fetched in chunks with progress updates
   - Cached in browser storage
   - WebGPU with WASM fallback

4. **Mock Data Pattern**
   - All data comes from local JSON files
   - MockDataService simulates API responses
   - Fuse.js for fuzzy product search

## Key Files to Understand

1. **Service Worker**: `packages/extension/src/background/service-worker.ts`
   - Central message hub
   - ML model management
   - Extension state

2. **Model Loader**: `packages/web-llm/src/model-loader.ts`
   - ONNX Runtime integration
   - WebGPU detection
   - Progressive loading

3. **Content Script**: `packages/extension/src/content/index.ts`
   - Site detection
   - UI injection
   - Page data extraction

## Common Development Tasks

### Adding a New E-commerce Site
1. Add domain to `packages/shared-mock-data/data/supported-sites.json`
2. Add selectors for price, coupon input, etc.
3. Update manifest.json host_permissions
4. Add mock coupons to `coupons.json`

### Modifying ML Models
1. Models loaded in `service-worker.ts` MODELS config
2. Update paths and sizes
3. Implement inference in `web-llm` package
4. Handle in message passing

### Adding UI Components
1. Create in `packages/extension/src/components/`
2. Use TailwindCSS classes from `global.css`
3. Follow existing patterns (CouponList, ChatInterface)
4. Ensure proper TypeScript types

## Testing Guidelines

- Unit tests with Jest for utilities and ML functions
- E2E tests with Cypress for user flows
- Mock chrome APIs in tests
- Test WebGPU fallback scenarios

## Performance Considerations

- Extension must load in <150ms
- Model inference <500ms
- Use React.memo for expensive components
- Lazy load models based on user interaction

## Debugging Tips

```javascript
// Enable debug logging
localStorage.setItem('SIMPLYCODES_DEBUG', 'true');

// Check WebGPU availability
navigator.gpu?.requestAdapter()

// Inspect service worker
chrome://extensions → Inspect views: service worker
```