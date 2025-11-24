#!/bin/bash
# Xcode Cloud Post-Build Script
# This script runs after Xcode builds the iOS app
# Currently used for any post-processing if needed

set -e

echo "🚀 Starting Xcode Cloud post-build script..."

# Get the project root (two levels up from ci_scripts)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "✅ Post-build script completed successfully!"

