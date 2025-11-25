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
IOS_APP_DIR="$PROJECT_ROOT/ios/App"

if [ ! -d "$IOS_APP_DIR" ]; then
    echo "❌ ios/App directory not found at: $IOS_APP_DIR"
    echo "📁 Project root: $PROJECT_ROOT"
    echo "📁 Contents of project root:"
    ls -la "$PROJECT_ROOT" | head -20
    exit 1
fi

cd "$IOS_APP_DIR"
export LANG=en_US.UTF-8

echo "📂 Current directory: $(pwd)"
echo "📁 Checking for Podfile:"
if [ ! -f "Podfile" ]; then
    echo "❌ Podfile not found!"
    echo "📁 Contents of ios/App:"
    ls -la
    exit 1
fi
echo "✅ Podfile found"

# Ensure CocoaPods is installed
if ! command -v pod &> /dev/null; then
    echo "Installing CocoaPods..."
    gem install cocoapods
fi

echo "🔧 Running pod install..."
# Install pods to generate the workspace
# Use --repo-update to ensure we have the latest pod specs
pod install --repo-update || pod install

echo "📁 Verifying workspace was created..."
WORKSPACE_PATH="$IOS_APP_DIR/App.xcworkspace"
if [ ! -d "$WORKSPACE_PATH" ]; then
    echo "❌ Workspace directory not found at: $WORKSPACE_PATH"
    echo "📁 Contents of ios/App:"
    ls -la
    exit 1
fi

if [ ! -f "$WORKSPACE_PATH/contents.xcworkspacedata" ]; then
    echo "❌ Workspace contents file not found!"
    echo "📁 Workspace directory contents:"
    ls -la "$WORKSPACE_PATH"
    exit 1
fi

echo "✅ Workspace created successfully!"
echo "📁 Workspace path: $WORKSPACE_PATH"
echo "📁 Workspace contents:"
ls -la "$WORKSPACE_PATH"

# Verify from project root
cd "$PROJECT_ROOT"
if [ -f "ios/App/App.xcworkspace/contents.xcworkspacedata" ]; then
    echo "✅ Workspace verified at ios/App/App.xcworkspace (relative to project root)"
else
    echo "❌ Workspace not found at ios/App/App.xcworkspace from project root!"
    echo "📁 Current directory: $(pwd)"
    echo "📁 Absolute path check: $WORKSPACE_PATH"
    exit 1
fi

cd "$PROJECT_ROOT"

echo "✅ Post-clone script completed successfully!"
echo "📁 Workspace exists at: ios/App/App.xcworkspace"

