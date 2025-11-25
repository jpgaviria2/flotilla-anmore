# Xcode Cloud Setup Guide

This guide will walk you through setting up Xcode Cloud for the Flotilla iOS app.

## Prerequisites

1. **Apple Developer Account** (paid membership required)
   - Go to [developer.apple.com](https://developer.apple.com)
   - Sign in with your Apple ID
   - Ensure you have an active Apple Developer Program membership ($99/year)

2. **Xcode 13+** installed on your Mac
   - Download from Mac App Store or [developer.apple.com](https://developer.apple.com/xcode/)

3. **GitHub Repository** connected
   - Your repository should be accessible (public or private with proper access)

## Step 1: Enable Xcode Cloud in Apple Developer Portal

1. Go to [developer.apple.com](https://developer.apple.com)
2. Sign in with your Apple ID
3. Navigate to **Account** → **Certificates, Identifiers & Profiles**
4. Click on **Xcode Cloud** in the left sidebar
5. If prompted, accept the Xcode Cloud terms and conditions
6. Wait for Xcode Cloud to be enabled (may take a few minutes)

## Step 2: Create Xcode Cloud Workflow in Xcode

1. **Open the project in Xcode:**
   ```bash
   open ios/App/App.xcworkspace
   ```
   ⚠️ **Important:** Open the `.xcworkspace` file, NOT the `.xcodeproj` file

2. **Navigate to Xcode Cloud:**
   - In Xcode, go to **Product** → **Xcode Cloud** → **Create Workflow...**
   - Or click on your project in the navigator, then select the **Cloud** tab

3. **Create a new workflow:**
   - Click the **+** button to create a new workflow
   - Name it (e.g., "iOS Build" or "Flotilla CI")

## Step 3: Configure Workflow Settings

### 3.1 Source Control

1. **Select your repository:**
   - Choose your GitHub repository
   - Select the branch (usually `master` or `main`)
   - Xcode Cloud will automatically detect the repository if it's connected

2. **If repository is not connected:**
   - Go to **Xcode** → **Settings** → **Accounts**
   - Click **+** to add your GitHub account
   - Authenticate with GitHub
   - Return to workflow creation

### 3.2 Build Configuration

1. **Select the scheme:**
   - Choose **"Flotilla Chat"** (or your app scheme name)
   - Ensure it's set to build for **iOS**

2. **Select the destination:**
   - Choose **Any iOS Device** or **Generic iOS Device**
   - For TestFlight builds, use **Any iOS Device**

3. **Build settings:**
   - **Configuration:** Release (for production) or Debug (for testing)
   - **Platform:** iOS
   - **SDK:** Latest iOS SDK

### 3.3 Environment Variables

1. **Click on "Environment Variables"** in the workflow settings

2. **Add required environment variables:**
   Click **+** to add each variable:

   ```
   VITE_PLATFORM_NAME=Flotilla
   VITE_PLATFORM_URL=https://app.flotilla.social
   VITE_PLATFORM_ACCENT=7161FF
   VITE_PLATFORM_DESCRIPTION=Flotilla is nostr — for communities.
   ```

   **Optional variables (if needed):**
   ```
   VITE_DEFAULT_PUBKEYS=your_pubkeys_here
   VITE_PLATFORM_RELAYS=wss://relay.example.com
   VITE_PLATFORM_LOGO=https://example.com/logo.png
   VITE_GLITCHTIP_API_KEY=your_key_here
   GLITCHTIP_AUTH_TOKEN=your_token_here
   ```

3. **Save the environment variables**

### 3.4 CI Scripts Location

1. **Verify CI scripts path:**
   - Xcode Cloud automatically looks for scripts in `ios/ci_scripts/`
   - Our scripts are already in place:
     - `ci_pre_xcodebuild.sh` (runs before build)
     - `ci_post_xcodebuild.sh` (runs after build)

2. **No additional configuration needed** - Xcode Cloud will find them automatically

## Step 4: Configure Build Actions

### 4.1 Pre-Build Actions

The `ci_pre_xcodebuild.sh` script will automatically:
- Install Node.js dependencies (pnpm or npm)
- Build the web application
- Sync Capacitor
- Install CocoaPods

**No manual configuration needed** - the script handles everything.

### 4.2 Post-Build Actions

The `ci_post_xcodebuild.sh` script is currently a placeholder.
You can add post-build tasks here if needed (e.g., uploading to TestFlight).

## Step 5: Set Up Code Signing

1. **In Xcode Cloud workflow settings:**
   - Go to **Signing & Capabilities**

2. **Select your team:**
   - Choose your Apple Developer team
   - Xcode Cloud will use your team's certificates

3. **Provisioning Profile:**
   - Xcode Cloud will automatically manage provisioning profiles
   - Ensure your App ID is registered in Apple Developer Portal

4. **Bundle Identifier:**
   - Verify it matches: `com.flotilla.anmore`
   - This should already be set in `capacitor.config.ts`

## Step 6: Configure TestFlight Distribution (Optional)

1. **In workflow settings:**
   - Enable **"Distribute to TestFlight"**
   - Select **"Automatically distribute to TestFlight"**

2. **Beta Testing:**
   - Choose internal testing, external testing, or both
   - Add testers if needed

## Step 7: Save and Start Workflow

1. **Review all settings:**
   - Source control: ✅
   - Build configuration: ✅
   - Environment variables: ✅
   - Code signing: ✅

2. **Click "Create" or "Save"** to create the workflow

3. **Start the first build:**
   - Click **"Start Build"** or push a commit to trigger the workflow
   - The workflow will run automatically on future commits to the selected branch

## Step 8: Monitor Builds

1. **In Xcode:**
   - Go to **Product** → **Xcode Cloud** → **View Workflows**
   - Or use the **Cloud** tab in the project navigator

2. **In Apple Developer Portal:**
   - Go to [developer.apple.com](https://developer.apple.com)
   - Navigate to **Xcode Cloud** → **Workflows**
   - View build status, logs, and artifacts

3. **Build notifications:**
   - Configure email notifications in workflow settings
   - Get notified of build success/failure

## Troubleshooting

### Build Fails: "Node.js not found"
- **Solution:** Xcode Cloud includes Node.js by default. If issues persist, the script will fall back to npm.

### Build Fails: "pnpm not found"
- **Solution:** The script automatically falls back to npm if pnpm is not available. Alternatively, you can install pnpm in the pre-build script:
  ```bash
  npm install -g pnpm
  ```

### Build Fails: "CocoaPods not installed"
- **Solution:** CocoaPods is installed automatically in the `ci_pre_xcodebuild.sh` script. Ensure the script has execute permissions (already set).

### Build Fails: "Environment variables not set"
- **Solution:** Double-check all environment variables are set in the workflow configuration. Variables are case-sensitive.

### Build Succeeds but App Doesn't Work
- **Check:** Ensure all required environment variables are set
- **Check:** Verify the web build completed successfully (check build logs)
- **Check:** Ensure Capacitor sync completed (check build logs)

### Viewing Build Logs
1. In Xcode Cloud dashboard, click on a build
2. Click on "View Logs" to see detailed output
3. Check the "Pre-build" section for script output
4. Look for any error messages in red

## Quick Reference

### Workflow File Location
- Workflows are stored in `.xcode-version` (if using version control)
- Or managed through Xcode Cloud dashboard

### CI Scripts Location
```
ios/ci_scripts/
├── ci_pre_xcodebuild.sh   (runs before Xcode build)
└── ci_post_xcodebuild.sh  (runs after Xcode build)
```

### Required Environment Variables
- `VITE_PLATFORM_NAME`
- `VITE_PLATFORM_URL`
- `VITE_PLATFORM_ACCENT`
- `VITE_PLATFORM_DESCRIPTION`

### Build Process Flow
1. Xcode Cloud clones repository
2. Runs `ci_pre_xcodebuild.sh`:
   - Installs dependencies
   - Builds web app
   - Syncs Capacitor
   - Installs CocoaPods
3. Xcode builds iOS app
4. Runs `ci_post_xcodebuild.sh` (if needed)
5. Distributes to TestFlight (if configured)

## Next Steps

1. ✅ Create workflow in Xcode
2. ✅ Configure environment variables
3. ✅ Set up code signing
4. ✅ Trigger first build
5. ✅ Monitor build status
6. ✅ Test the built app

## Support

If you encounter issues:
1. Check build logs in Xcode Cloud dashboard
2. Verify all environment variables are set
3. Ensure CI scripts have execute permissions
4. Check that the workspace file is used (not .xcodeproj)

---

**Last Updated:** November 2024
**Project:** Flotilla Anmore
**Version:** 1.5.7

