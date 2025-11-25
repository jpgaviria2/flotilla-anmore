#!/bin/bash
# Xcode Cloud Post-Clone Script
# This script runs immediately after cloning the repository
# It sets up the workspace and installs dependencies needed before Xcode resolves packages

set -e

echo "🚀 Starting Xcode Cloud post-clone script..."

# Get the project root (two levels up from ci_scripts)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "📦 Installing Node.js dependencies..."
# Install Node.js dependencies first (needed for build scripts)
if command -v pnpm &> /dev/null; then
    echo "Using pnpm..."
    pnpm install
else
    echo "Using npm..."
    npm install
fi

echo "📱 Installing CocoaPods dependencies..."
# Install CocoaPods dependencies to generate the workspace
cd ios/App
export LANG=en_US.UTF-8

# Ensure CocoaPods is installed
if ! command -v pod &> /dev/null; then
    echo "Installing CocoaPods..."
    gem install cocoapods
fi

# Install pods to generate the workspace
pod install

cd "$PROJECT_ROOT"

echo "✅ Post-clone script completed successfully!"
echo "📁 Workspace should now exist at: ios/App/App.xcworkspace"

