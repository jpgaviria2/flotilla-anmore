# Routing Architecture Review

## Current Situation

The app has two marketplace routes:
1. `/home/marketplace` - Used in PrimaryNav (main navigation)
2. `/spaces/[relay]/marketplace` - Used in MenuSpace (space-specific navigation)

## Problem

Since this project only uses one space at `relay.anmore.me`, having both routes causes:
- Code duplication (changes need to be made in two places)
- Confusion about which route to use
- Maintenance burden

## Recommended Solution

Since `ANMORE_RELAY` is the only relay used, we should:

### Option 1: Redirect /spaces routes to /home routes (RECOMMENDED)
- Add redirects in `/spaces/[relay]/+page.svelte` and other space routes
- If relay === ANMORE_RELAY, redirect to corresponding /home route
- Keep /spaces routes for potential future multi-space support, but redirect to /home for ANMORE_RELAY

### Option 2: Make MenuSpace use /home routes directly
- Change `makeSpacePath` calls in MenuSpace to check if url === ANMORE_RELAY
- If yes, use /home routes instead of /spaces routes
- This keeps routing logic in one place

### Option 3: Remove /spaces routes entirely
- Delete `/spaces/[relay]/marketplace` and other space-specific routes
- Update all navigation to use /home routes
- This is the cleanest but most invasive change

## Implementation for Option 1 (Recommended)

In `/spaces/[relay]/+page.svelte` and other space route pages:
```typescript
import {ANMORE_RELAY} from "@app/core/state"
import {goto} from "$app/navigation"

const url = decodeRelay($page.params.relay!)

if (url === ANMORE_RELAY) {
  goto("/home/marketplace") // or appropriate /home route
}
```

This way:
- /spaces routes still exist for potential future use
- But they automatically redirect to /home routes for ANMORE_RELAY
- All changes only need to be made in /home routes
- No code duplication

