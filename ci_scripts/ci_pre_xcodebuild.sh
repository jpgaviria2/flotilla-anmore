#!/bin/bash
# Xcode Cloud Pre-Build Script
# This script runs before Xcode builds the iOS app
# It builds the web application, syncs with Capacitor, and installs CocoaPods

set -e

echo "🚀 Starting Xcode Cloud pre-build script..."

# Get the project root (one level up from ci_scripts at repository root)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
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

echo "📱 Ensuring CocoaPods dependencies are installed..."
# Double-check that Pods are installed (in case post-clone script didn't run)
IOS_APP_DIR="$(pwd)/ios/App"
if [ ! -d "$IOS_APP_DIR/Pods" ]; then
    echo "⚠️ Pods directory not found! Installing CocoaPods dependencies..."
    cd "$IOS_APP_DIR"
    export LANG=en_US.UTF-8
    
    # Ensure CocoaPods is installed
    if ! command -v pod &> /dev/null; then
        echo "Installing CocoaPods..."
        gem install cocoapods
    fi
    
    echo "🔧 Running pod install..."
    pod install || pod install --repo-update
    
    # Verify Pods were installed
    if [ ! -d "Pods" ]; then
        echo "❌ Pods directory still not found after pod install!"
        echo "📁 Current directory: $(pwd)"
        echo "📁 Contents:"
        ls -la
        exit 1
    fi
    
    echo "✅ Pods installed successfully in pre-build script"
    cd "$PROJECT_ROOT"
else
    echo "✅ Pods directory already exists"
fi

# Verify xcconfig files exist
XCCONFIG_FILE="$IOS_APP_DIR/Pods/Target Support Files/Pods-Flotilla Chat/Pods-Flotilla Chat.release.xcconfig"
if [ ! -f "$XCCONFIG_FILE" ]; then
    echo "❌ xcconfig file not found at: $XCCONFIG_FILE"
    echo "📁 Checking Pods/Target Support Files:"
    ls -la "$IOS_APP_DIR/Pods/Target Support Files/" 2>/dev/null || echo "Target Support Files not found"
    echo "⚠️ Attempting to reinstall pods..."
    cd "$IOS_APP_DIR"
    pod install
    cd "$PROJECT_ROOT"
    
    # Check again
    if [ ! -f "$XCCONFIG_FILE" ]; then
        echo "❌ xcconfig file still not found after reinstall!"
        exit 1
    fi
fi

echo "✅ xcconfig files verified"

echo "✅ Pre-build script completed successfully!"

