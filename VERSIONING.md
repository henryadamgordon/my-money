# Version Management

## How It Works

This app uses **automatic version synchronization** from `package.json` to ensure there's always a single source of truth for the version number.

### The Safest Approach ✅

The version is automatically read from `package.json` at build time and injected into the app via Vite's `define` feature.

**Files involved:**
- `package.json` - Single source of truth (update version here)
- `vite.config.ts` - Reads version and injects it as global constants
- `src/app.d.ts` - TypeScript declarations for the global constants
- `src/lib/version.ts` - Exports the version for use in the app

### How to Update the Version

1. **Update `package.json` only:**
   ```json
   {
     "version": "0.0.5"
   }
   ```

2. **Build the app:**
   ```bash
   npm run build
   ```

3. **Done!** The version will automatically be updated throughout the app.

### Why This Approach?

**Pros:**
- ✅ Single source of truth (package.json)
- ✅ No manual sync needed
- ✅ No risk of version mismatch
- ✅ Automatic at build time
- ✅ Type-safe with TypeScript
- ✅ Works in development and production

**Previous issues:**
- ❌ Had to update version in two places (package.json AND version.ts)
- ❌ Easy to forget to sync
- ❌ Version could be out of sync

### Technical Details

The version is injected at build time using Vite's `define` option:
- `__APP_VERSION__` → replaced with the version from package.json
- `__APP_NAME__` → replaced with the name from package.json

These constants are defined as globals and replaced during the build process, so there's zero runtime overhead.
