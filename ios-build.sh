#!/usr/bin/env bash
# iOS Build Script
# This script builds the web app, syncs with Capacitor, installs pods, and opens Xcode

set -e

echo "Building iOS app..."

# Build web application and sync with Capacitor
echo "Step 1: Building web application..."
npm run build || npx pnpm run build

# Install iOS dependencies
echo "Step 2: Installing CocoaPods dependencies..."
cd ios/App
export LANG=en_US.UTF-8
pod install
cd ../..

echo "Step 3: Opening Xcode workspace..."
open ios/App/App.xcworkspace

echo "✅ iOS build setup complete!"
echo "📱 You can now build and run the app in Xcode"

