# Anmore Flotilla Customization Guide

This document describes all customizations made to Flotilla for the Anmore platform. Use this guide to re-apply customizations after pulling updates from the upstream repository.

## Overview

The Anmore version of Flotilla is configured as a single-relay platform with the following key features:

- **Single Relay Mode**: Uses `wss://relay.anmore.me` exclusively
- **Global Navigation**: Five main tabs (Feed, Fundraising, Marketplace Goods, Marketplace Services, Calendar)
- **NIP-5 Filtering**: Only displays content from verified domains (anmore.me, anmore.cash, trailscoffee.com)
- **Enhanced Fundraising**: Tracks campaign balances via Zap receipts (Kind 9735)
- **Marketplace Support**: Implements NIP-99 classified listings with goods/services differentiation

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the project root with:

```bash
VITE_PLATFORM_RELAYS=wss://relay.anmore.me
VITE_DEFAULT_RELAYS=wss://relay.anmore.me
VITE_DEFAULT_MESSAGING_RELAYS=wss://relay.anmore.me
VITE_INDEXER_RELAYS=wss://relay.anmore.me
VITE_PLATFORM_URL=https://flotilla.anmore.me
VITE_PLATFORM_NAME=Anmore
VITE_PLATFORM_LOGO=/logo.png
```

**Note**: The `.env` file is gitignored. Make sure to create it before running the application.

## Code Changes

### 1. Core State Configuration

**File**: `src/app/core/state.ts`

- **Lines ~170**: Added `ALLOWED_NIP05_DOMAINS` constant with allowed domains
- **Lines ~173**: Added `isAllowedNip05()` helper function to validate NIP-5 domains
- **Lines ~275**: Added `MARKETPLACE_LISTING` constant (30017) for NIP-99 support
- **Lines ~277**: Updated `CONTENT_KINDS` array to include `MARKETPLACE_LISTING`

### 2. New Utility Files

**File**: `src/app/util/filtering.ts`
- Purpose: NIP-5 domain filtering
- Export: `filterEventsByNip05()` - filters events by allowed NIP-5 domains

**File**: `src/app/util/marketplace.ts`
- Purpose: Marketplace event handling
- Exports:
  - `MarketplaceType` - Type for goods/services
  - `getMarketplaceType()` - Extracts marketplace type from event
  - `filterMarketplaceByType()` - Filters listings by type

**File**: `src/app/util/fundraising.ts`
- Purpose: Fundraising balance tracking
- Exports:
  - `getLightningAddressFromGoal()` - Extracts lightning address from goal
  - `getZapGoalAmount()` - Gets target amount from goal
  - `calculateGoalBalance()` - Calculates current balance from Zap receipts
  - `getGoalProgress()` - Calculates funding percentage

### 3. Navigation Changes

**File**: `src/app/components/PrimaryNav.svelte`

- **Added imports** (~Lines 14-18):
  ```svelte
  import NotesMinimalistic from "@assets/icons/notes-minimalistic.svg?dataurl"
  import StarFallMinimalistic from "@assets/icons/star-fall-minimalistic-2.svg?dataurl"
  import ShoppingBag from "@assets/icons/bag-2.svg?dataurl"
  import Transmission from "@assets/icons/transmission.svg?dataurl"
  import CalendarMinimalistic from "@assets/icons/calendar-minimalistic.svg?dataurl"
  ```

- **Modified navigation section** (~Lines 61-95): Replaced space-based navigation with global tabs when `PLATFORM_RELAYS.length > 0`

### 4. New Route Pages

**File**: `src/routes/feed/+page.svelte`
- Displays THREAD events (Kind 1)
- Applies NIP-5 filtering
- Uses existing ThreadItem component

**File**: `src/routes/fundraising/+page.svelte`
- Displays ZAP_GOAL events (Kind 9041)
- Applies NIP-5 filtering
- Uses existing GoalItem component
- Supports balance tracking via Zap receipts

**File**: `src/routes/marketplace/goods/+page.svelte`
- Displays MARKETPLACE_LISTING events (Kind 30017) with type=goods
- Applies NIP-5 filtering
- Uses new MarketplaceListing component

**File**: `src/routes/marketplace/services/+page.svelte`
- Displays MARKETPLACE_LISTING events (Kind 30017) with type=services
- Applies NIP-5 filtering
- Uses new MarketplaceListing component

**File**: `src/routes/calendar/+page.svelte`
- Displays EVENT_TIME events (Kind 31923)
- Applies NIP-5 filtering
- Uses existing CalendarEventItem component

### 5. New Components

**File**: `src/app/components/MarketplaceListing.svelte`
- Displays marketplace listings with:
  - Title, description, and images
  - Price and location information
  - Seller information via PersonCard
  - Type badge (Goods/Services)

## Upgrade Process

When pulling updates from upstream Flotilla:

1. **Fetch upstream changes**:
   ```bash
   git fetch upstream
   ```

2. **Create a new branch** from upstream/master:
   ```bash
   git checkout -b development-v1.x.x upstream/master
   ```

3. **Re-apply customizations** using this document as reference:
   - Update `src/app/core/state.ts`
   - Copy utility files (filtering.ts, marketplace.ts, fundraising.ts)
   - Update `src/app/components/PrimaryNav.svelte`
   - Copy route pages (feed, fundraising, marketplace, calendar)
   - Copy MarketplaceListing.svelte component

4. **Create/update .env file** with Anmore configuration

5. **Test all functionality** (see Testing Checklist below)

6. **Create or update commit**:
   ```bash
   git add .
   git commit -m "Apply Anmore customizations to v1.x.x"
   ```

## Testing Checklist

Before deploying, verify:

- [ ] **Environment**: `.env` file exists with correct relay configuration
- [ ] **Platform Mode**: Only relay.anmore.me is used (no space browsing UI visible)
- [ ] **Navigation**: All 5 tabs (Feed, Fundraising, Marketplace Goods, Marketplace Services, Calendar) are visible and clickable
- [ ] **NIP-5 Filtering**: Only content from anmore.me, anmore.cash, and trailscoffee.com appears
- [ ] **Feed Tab**: Thread posts display correctly with NIP-5 filtering
- [ ] **Fundraising Tab**: Goals display with balance tracking from Zap receipts
- [ ] **Marketplace Goods**: Listings with type=goods display correctly
- [ ] **Marketplace Services**: Listings with type=services display correctly
- [ ] **Calendar Tab**: Calendar events display correctly with NIP-5 filtering
- [ ] **Content Creation**: Users can create threads, goals, and events
- [ ] **Mobile Navigation**: Bottom nav shows correct tabs on mobile

## Nostr Event Kinds Reference

- **THREAD** (1): Regular text posts (Feed)
- **ZAP_GOAL** (9041): Fundraising campaigns
- **ZAP_RESPONSE** (9735): Zap receipts for balance tracking
- **MARKETPLACE_LISTING** (30017): NIP-99 classified listings
- **EVENT_TIME** (31923): Calendar events

## NIP References

- **NIP-05**: DNS-based verification (used for content filtering)
- **NIP-57**: Lightning Zaps (used for fundraising balance tracking)
- **NIP-99**: Classified Listings (used for marketplace)

## File Structure

```
src/
├── app/
│   ├── components/
│   │   ├── PrimaryNav.svelte (MODIFIED)
│   │   └── MarketplaceListing.svelte (NEW)
│   ├── core/
│   │   └── state.ts (MODIFIED)
│   └── util/
│       ├── filtering.ts (NEW)
│       ├── marketplace.ts (NEW)
│       └── fundraising.ts (NEW)
└── routes/
    ├── feed/
    │   └── +page.svelte (NEW)
    ├── fundraising/
    │   └── +page.svelte (NEW)
    ├── marketplace/
    │   ├── goods/
    │   │   └── +page.svelte (NEW)
    │   └── services/
    │       └── +page.svelte (NEW)
    └── calendar/
        └── +page.svelte (NEW)
```

## Maintenance Notes

### Keeping in Sync with Upstream

- **Monitor upstream releases**: Watch the coracle-social/flotilla repository for updates
- **Review changelogs**: Check what changed in upstream before merging
- **Test customizations**: After each merge, verify all custom features still work
- **Document new changes**: Update this file if customizations need to be modified

### Git Workflow

Recommended branch strategy:

- `main`: Stable Anmore releases
- `development`: Active development with latest upstream + Anmore customizations
- `upstream/master`: Track the original Flotilla repository

### Versioning

Tag Anmore releases as: `v<flotilla-version>-anmore-<increment>`

Example: `v1.6.3-anmore-1` (based on Flotilla 1.6.3, first Anmore increment)

## Support

For questions about these customizations, contact the Anmore development team.

For upstream Flotilla issues, refer to: https://github.com/coracle-social/flotilla