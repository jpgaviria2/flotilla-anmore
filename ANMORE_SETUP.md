# Anmore Flotilla Setup Guide

Quick start guide for setting up the Anmore-customized Flotilla instance.

## Prerequisites

- Node.js (v18 or higher)
- pnpm package manager

## Quick Setup

### 1. Create Environment File

Create a `.env` file in the project root:

```bash
cat > .env << 'EOF'
VITE_PLATFORM_RELAYS=wss://relay.anmore.me
VITE_DEFAULT_RELAYS=wss://relay.anmore.me
VITE_DEFAULT_MESSAGING_RELAYS=wss://relay.anmore.me
VITE_INDEXER_RELAYS=wss://relay.anmore.me
VITE_PLATFORM_URL=https://flotilla.anmore.me
VITE_PLATFORM_NAME=Anmore
VITE_PLATFORM_LOGO=/logo.png
EOF
```

Or use the automation script:

```bash
./scripts/apply-customizations.sh
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Run Development Server

```bash
pnpm dev
```

The application will be available at http://localhost:1848/ (or another port if 1847/1848 are in use).

## Features

### Global Navigation Tabs

When logged in, you'll see 5 main tabs:

1. **Feed** - Thread posts and discussions
2. **Fundraising** - Fundraising campaigns with balance tracking
3. **Marketplace Goods** - Buy/sell physical goods
4. **Marketplace Services** - Offer/request services
5. **Calendar** - Upcoming events

### NIP-5 Verification Filtering

Only content from users with verified NIP-5 identifiers from these domains will be displayed:
- anmore.me
- anmore.cash
- trailscoffee.com

### Single Relay Mode

The application is configured to use only `wss://relay.anmore.me`. Space browsing and selection features are disabled.

## Development

### Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── PrimaryNav.svelte        # Modified: Global navigation
│   │   └── MarketplaceListing.svelte # New: Marketplace display
│   ├── core/
│   │   └── state.ts                  # Modified: Added constants
│   └── util/
│       ├── filtering.ts              # New: NIP-5 filtering
│       ├── marketplace.ts            # New: Marketplace utilities
│       └── fundraising.ts            # New: Balance tracking
└── routes/
    ├── feed/                         # New: Feed tab
    ├── fundraising/                  # New: Fundraising tab
    ├── marketplace/                  # New: Marketplace tabs
    └── calendar/                     # New: Calendar tab
```

### Key Customizations

See [ANMORE_CUSTOMIZATION.md](ANMORE_CUSTOMIZATION.md) for detailed information about all customizations.

## Building for Production

```bash
pnpm build
```

The built files will be in the `build/` directory.

## Troubleshooting

### Port Already in Use

If you see "Port 1847 is in use", Vite will automatically try the next available port. Check the terminal output for the actual URL.

### Missing .env File

If you get errors about missing environment variables, make sure the `.env` file exists and contains all required variables.

### NIP-5 Verification Not Working

Make sure users have proper NIP-5 identifiers set up in their profiles. The filtering happens at the data layer, so incorrectly configured NIP-5 identifiers will result in no content being displayed.

## Support

For Anmore-specific issues, contact the Anmore development team.

For upstream Flotilla issues, see: https://github.com/coracle-social/flotilla