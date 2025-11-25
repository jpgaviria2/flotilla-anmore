#!/bin/bash
# Xcode Cloud Post-Clone Script
# This script runs immediately after cloning the repository
# It sets up the workspace and installs dependencies needed before Xcode resolves packages

set -e

echo "🚀 Starting Xcode Cloud post-clone script..."
echo "📂 Current directory: $(pwd)"
echo "📂 Script location: $(dirname "${BASH_SOURCE[0]}")"

# Get the project root (one level up from ci_scripts at repository root)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "📂 Project root: $PROJECT_ROOT"
echo "📁 Listing project structure:"
ls -la | head -10

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

echo "📂 Current directory: $(pwd)"
echo "📁 Checking for Podfile:"
ls -la Podfile || echo "❌ Podfile not found!"

# Ensure CocoaPods is installed
if ! command -v pod &> /dev/null; then
    echo "Installing CocoaPods..."
    gem install cocoapods
fi

echo "🔧 Running pod install..."
# Install pods to generate the workspace
pod install

echo "📁 Verifying workspace was created:"
if [ -f "App.xcworkspace/contents.xcworkspacedata" ]; then
    echo "✅ Workspace created successfully!"
    ls -la App.xcworkspace/
else
    echo "❌ Workspace not found after pod install!"
    echo "📁 Contents of ios/App:"
    ls -la
    exit 1
fi

cd "$PROJECT_ROOT"

echo "✅ Post-clone script completed successfully!"
echo "📁 Workspace exists at: ios/App/App.xcworkspace"

