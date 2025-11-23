# iOS Build Environment Variables Analysis

## Summary

**YES, the `.env` file IS used in iOS builds**, but there are some important details about how it works:

## How Environment Variables Flow into iOS Build

### 1. Build Process Flow

```
ios-build.sh or pnpm run release:ios
  └─> npm run build (calls build.sh)
       ├─> Source .env.template (for shell variables)
       ├─> vite build (loads .env via dotenv)
       │    └─> Embeds VITE_* vars into JavaScript bundle
       ├─> Replace index.html placeholders (uses .env.template vars)
       └─> cap sync
            └─> Copies built bundle (with embedded env vars) to iOS
```

### 2. Where `.env` is Loaded

#### ✅ **Vite Configuration** (`vite.config.ts`)
```typescript
config({path: ".env"})      // Loads .env first
config({path: ".env.template"})  // Then .env.template (overrides .env)
```
- Vite loads **BOTH** `.env` and `.env.template` (`.env.template` takes precedence)
- This happens during `vite build`, which embeds `VITE_*` variables into the JavaScript bundle

#### ✅ **PWA Assets Config** (`pwa-assets.config.js`)
```javascript
dotenv.config({path: ".env"})
dotenv.config({path: ".env.template"})
```
- Also loads both files for PWA asset generation

#### ⚠️ **Build Script** (`build.sh`)
```bash
if [ -f .env.template ]; then
  source .env.template  # Only sources .env.template, NOT .env
fi
```
- Only sources `.env.template` for shell script use
- Used for Perl replacements in `index.html` (lines 26-29)
- Does NOT source `.env` directly

### 3. Variables Used in iOS App

All `VITE_*` environment variables are embedded into the JavaScript bundle during the Vite build process and used in the app code:

**Location:** `src/app/core/state.ts`

```typescript
export const PLATFORM_URL = import.meta.env.VITE_PLATFORM_URL
export const PLATFORM_NAME = import.meta.env.VITE_PLATFORM_NAME
export const PLATFORM_ACCENT = import.meta.env.VITE_PLATFORM_ACCENT
export const PLATFORM_DESCRIPTION = import.meta.env.VITE_PLATFORM_DESCRIPTION
export const DEFAULT_BLOSSOM_SERVERS = fromCsv(import.meta.env.VITE_DEFAULT_BLOSSOM_SERVERS)
export const DEFAULT_PUBKEYS = import.meta.env.VITE_DEFAULT_PUBKEYS
// ... and more
```

These variables are:
1. **Read from `.env`** (or `.env.template` if it overrides) during build
2. **Embedded into the JavaScript bundle** by Vite's build process
3. **Copied to iOS** via `cap sync` (from `build/` to `ios/App/App/public/`)
4. **Available at runtime** in the iOS app as `import.meta.env.VITE_*`

## Important Considerations

### ✅ What Works

1. **Vite build variables**: All `VITE_*` variables from `.env` are embedded into the bundle
2. **Runtime access**: Variables are available in iOS app via `import.meta.env.VITE_*`
3. **PWA assets**: Logo and assets use `.env` variables via `pwa-assets.config.js`

### ⚠️ Potential Issues

1. **index.html replacements**: The Perl script in `build.sh` (lines 26-29) only uses variables from `.env.template`, not `.env`
   - If you have both files, `.env` values won't be used for HTML replacements
   - Only variables from `.env.template` are used for `{NAME}`, `{DESCRIPTION}`, `{ACCENT}`, `{URL}` placeholders

2. **Variable precedence**: 
   - Vite loads `.env.template` AFTER `.env`, so `.env.template` values override `.env`
   - For consistency, you may want to only use `.env.template` or ensure `.env` values take precedence

### 🔧 Recommendations

1. **For iOS builds**, ensure your `.env` file has all necessary `VITE_*` variables
2. **For consistency**, consider updating `build.sh` to also source `.env`:
   ```bash
   if [ -f .env ]; then
     source .env
   fi
   if [ -f .env.template ]; then
     source .env.template
   fi
   ```
3. **Best practice**: Use `.env` for local overrides and `.env.template` as defaults/template

## Example Variables Needed for iOS Build

Based on `.env.template`, these variables are used:

```bash
VITE_PLATFORM_URL=https://app.flotilla.social
VITE_PLATFORM_NAME=Flotilla
VITE_PLATFORM_LOGO=static/logo.png
VITE_PLATFORM_ACCENT="#7161FF"
VITE_PLATFORM_DESCRIPTION="Flotilla is nostr — for communities."
VITE_DEFAULT_PUBKEYS=...
VITE_DEFAULT_BLOSSOM_SERVERS=https://blossom.primal.net/
VITE_INDEXER_RELAYS=wss://...
VITE_SIGNER_RELAYS=wss://...
VITE_GLITCHTIP_API_KEY=...
# ... and more
```

All of these will be embedded into the iOS app bundle during build if present in `.env` or `.env.template`.

