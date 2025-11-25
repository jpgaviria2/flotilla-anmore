#!/bin/bash
# Xcode Cloud Pre-Build Script
# This script runs before Xcode builds the iOS app
# It builds the web application, syncs with Capacitor, and installs CocoaPods

set -e

echo "🚀 Starting Xcode Cloud pre-build script..."

# Get the project root (two levels up from ci_scripts)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "📦 Installing dependencies..."
# Install Node.js dependencies
if command -v pnpm &> /dev/null; then
    echo "Using pnpm..."
    pnpm install
else
    echo "Using npm..."
    npm install
fi

echo "🔨 Building web application..."
# Build the web app (uses build.sh which handles env vars and vite build)
if command -v pnpm &> /dev/null; then
    pnpm run build || ./build.sh
else
    npm run build || ./build.sh
fi

echo "🔄 Syncing Capacitor..."
# Sync Capacitor (copies web build to iOS)
npx cap sync ios

# Note: CocoaPods dependencies are installed in ci_post_clone.sh
# to ensure workspace exists before Xcode resolves packages

echo "✅ Pre-build script completed successfully!"

