# iOS Build Guide

This guide covers how to build and deploy the Flotilla iOS app using Capacitor and Xcode.

## Prerequisites

### 1. Development Environment

- **macOS** (required for iOS development)
- **Xcode** (latest version recommended, Xcode 9.2+ minimum)
  - Install from the Mac App Store or download from [developer.apple.com](https://developer.apple.com/xcode/)
- **Xcode Command Line Tools**
  ```bash
  xcode-select --install
  ```
- **CocoaPods** (dependency manager for iOS)
  ```bash
  sudo gem install cocoapods
  ```
- **Node.js** and **pnpm** (package manager)
  ```bash
  # Install pnpm if not already installed
  npm install -g pnpm
  ```

### 2. Apple Developer Account

- **Apple Developer Program** membership
  - Required for device testing and App Store distribution
  - Sign up at [developer.apple.com](https://developer.apple.com/programs/)
- **Development Team ID**: The Xcode project uses automatic signing, so you'll configure your team in Xcode

### 3. Project Configuration

The iOS project is located in `ios/App/` and is configured for:
- **Minimum iOS version**: 14.0
- **Bundle Identifier**: `social.flotilla`
- **Deployment Target**: iOS 14.0+

## Build Process

### Step 1: Install Dependencies

First, install all Node.js dependencies:

```bash
pnpm install
```

### Step 2: Build Web Application

Build the SvelteKit web application and sync it to the iOS project:

```bash
pnpm run build
```

This script:
- Loads environment variables from `.env` and `.env.template` files
- Builds the SvelteKit app to the `build/` directory (embeds `VITE_*` variables into the bundle)
- Runs `npx cap sync` to sync web assets to native iOS project
- Generates app icons and splash screens using Capacitor Assets

**Note**: Environment variables from `.env` are embedded into the JavaScript bundle during build and will be available in the iOS app at runtime. See [IOS_ENV_ANALYSIS.md](./IOS_ENV_ANALYSIS.md) for details.

Alternatively, you can use the iOS-specific release script:

```bash
pnpm run release:ios
```

This builds the app and opens it in Xcode automatically.

### Step 3: Install iOS Dependencies

Install CocoaPods dependencies for the iOS project:

```bash
cd ios/App
export LANG=en_US.UTF-8  # Required for CocoaPods UTF-8 encoding
pod install
cd ../..
```

**Note**: Always use the `.xcworkspace` file (created by CocoaPods), not the `.xcodeproj` file when opening in Xcode.

**Quick Build Script**: You can also use the provided `ios-build.sh` script which automates all steps:
```bash
./ios-build.sh
```

### Step 4: Open in Xcode

Open the workspace in Xcode:

```bash
open ios/App/App.xcworkspace
```

Or use the release script which does this automatically:

```bash
pnpm run release:ios
```

### Step 5: Configure Signing

In Xcode:

1. Select the project in the navigator (top item "App")
2. Select the "Flotilla Chat" target
3. Go to the "Signing & Capabilities" tab
4. Check "Automatically manage signing"
5. Select your Development Team from the dropdown
6. Verify the Bundle Identifier is `social.flotilla`

Xcode will automatically create provisioning profiles if needed.

### Step 6: Select Target Device

In Xcode's toolbar:
- Choose a simulator (e.g., "iPhone 15 Pro") or a connected physical device
- For physical devices, ensure they are registered in your Apple Developer account

### Step 7: Build and Run

- Click the "Run" button (▶️) in Xcode, or press `Cmd+R`
- For simulator: The app will launch automatically
- For device: You may need to trust the developer certificate on your device (Settings > General > VPN & Device Management)

## Development Workflow

### Live Reload (Optional)

For development with live reload, uncomment the server configuration in `capacitor.config.ts`:

```typescript
server: {
  url: "http://YOUR_LOCAL_IP:1847",
  cleartext: true
},
```

Replace `YOUR_LOCAL_IP` with your Mac's local IP address (e.g., `192.168.1.115`).

Then run the dev server:

```bash
pnpm run dev
```

The app will automatically reload when you make changes to the web code.

### Updating Web Code

After making changes to the web application:

```bash
pnpm run build
npx cap sync ios
```

Then rebuild in Xcode.

## Capabilities and Permissions

### Push Notifications

The app is configured for push notifications:

- **Entitlements**: Configured in `ios/App/Flotilla Chat.entitlements`
- **Info.plist**: Background mode for remote notifications enabled
- **APNs Certificates**: Configure in [Apple Developer Portal](https://developer.apple.com/account/resources/identifiers/list/certificate)

**Note**: The entitlements file currently has `aps-environment` set to `development`. For production, update this to `production` in the Apple Developer Portal.

### Associated Domains

The app includes Universal Links configuration:

- **Domain**: `app.flotilla.social`
- **Configuration**: Set in entitlements file

To use Universal Links:
1. Verify domain ownership in Apple Developer Portal
2. Create an `apple-app-site-association` file on your web server
3. Ensure the file is served with `Content-Type: application/json`

## App Store Distribution

### 1. Create App Store Connect Listing

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Create a new app
3. Fill in app information (name, description, screenshots, etc.)
4. Note the Bundle ID must match: `social.flotilla`

### 2. Archive and Upload

1. In Xcode, select "Any iOS Device" as the target
2. Go to **Product > Archive**
3. Once archived, the Organizer window will open
4. Click **Distribute App**
5. Choose distribution method:
   - **App Store Connect**: For App Store submission
   - **Ad Hoc**: For testing with specific devices
   - **Enterprise**: For enterprise distribution
6. Follow the prompts to upload

### 3. Submit for Review

1. In App Store Connect, select your build
2. Complete all required information
3. Submit for review

## Troubleshooting

### CocoaPods Issues

If you encounter pod installation issues:

```bash
cd ios/App
pod deintegrate
pod install
```

### Code Signing Errors

- Ensure your Apple Developer account is active
- Check that your device is registered in the Developer Portal
- Verify the Bundle Identifier matches your App ID
- Try cleaning the build folder: **Product > Clean Build Folder** (`Cmd+Shift+K`)

### Build Errors

- Ensure all dependencies are installed: `pnpm install` and `pod install`
- Check Xcode and CocoaPods versions are up to date
- Try cleaning derived data: `rm -rf ~/Library/Developer/Xcode/DerivedData`

### Missing Web Assets

If the app doesn't load web content:

1. Verify `build/` directory exists after running `pnpm run build`
2. Run `npx cap sync ios` to ensure assets are synced
3. Check that the `webDir` in `capacitor.config.ts` points to `build`

### Push Notifications Not Working

- Verify APNs certificates are configured in Apple Developer Portal
- Check `aps-environment` in entitlements matches your build type
- Ensure push notification capability is enabled in Xcode

## Project Structure

```
ios/
├── App/
│   ├── App/
│   │   ├── AppDelegate.swift       # App lifecycle and configuration
│   │   ├── Info.plist              # App metadata and permissions
│   │   ├── Assets.xcassets/        # App icons and images
│   │   └── Base.lproj/             # Storyboards
│   ├── App.xcodeproj/              # Xcode project file
│   ├── App.xcworkspace/            # CocoaPods workspace (use this!)
│   ├── Podfile                     # CocoaPods dependencies
│   ├── Flotilla Chat.entitlements  # Capabilities and permissions
│   └── PrivacyInfo.xcprivacy       # Privacy manifest
```

## Capacitor Plugins

The following Capacitor plugins are configured:

- **@capacitor/app**: App lifecycle and state
- **@capacitor/filesystem**: File system operations
- **@capacitor/keyboard**: Keyboard handling
- **@capacitor/preferences**: Persistent storage
- **@capacitor/push-notifications**: Push notifications
- **@capacitor-community/safe-area**: Safe area insets
- **@capawesome/capacitor-badge**: Badge management
- **nostr-signer-capacitor-plugin**: Nostr signing capabilities

## Environment Variables

The `.env` file is used during the iOS build process. All `VITE_*` environment variables are embedded into the JavaScript bundle during build and are available at runtime in the iOS app.

For detailed information about how environment variables work in iOS builds, see [IOS_ENV_ANALYSIS.md](./IOS_ENV_ANALYSIS.md).

## Additional Resources

- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [Xcode User Guide](https://developer.apple.com/documentation/xcode)

