# TestFlight Release Checklist

## Pre-Release Steps

### 1. Verify Icons Are Present ✅
- [x] App Icon: `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` (1024x1024)
- [x] Splash screens: Multiple sizes present in `Splash.imageset/`
- [x] All icon sizes generated and in Assets.xcassets

### 2. Update Version and Build Numbers

In Xcode:
1. Select project → "Flotilla Chat" target
2. General tab:
   - **Version**: Increment (e.g., 1.5.4)
   - **Build**: Increment or use date-based (e.g., 20251122)

### 3. Verify App Configuration

- [x] Bundle ID: `com.flotilla.anmore`
- [x] App Name: Flotilla Chat
- [x] Display Name: Flotilla
- [x] Info.plist has all required keys:
  - [x] NSAppTransportSecurity configured
  - [x] NSAllowsArbitraryLoadsInWebContent: true
  - [x] UIBackgroundModes: remote-notification

### 4. Build and Test Locally

```bash
# Build the app
npm run release:ios

# Or manually in Xcode:
# 1. Open ios/App/App.xcworkspace
# 2. Select "Any iOS Device"
# 3. Product → Archive (Cmd+Shift+B)
```

### 5. Verify Features Work

- [x] NIP-05 verification works (checkmark appears for verified profiles)
- [x] Safe area handling (no UI overlap with notch/status bar)
- [x] Relay connection (wss://relay.anmore.me)
- [x] Push notifications (if configured)
- [x] All app functionality tested on physical device

## Archive and Upload

### 6. Archive in Xcode

1. **Select "Any iOS Device"** (not simulator)
2. **Product → Archive** (Cmd+Shift+B)
3. Wait for archive to complete
4. **Organizer** window opens automatically

### 7. Upload to App Store Connect

1. **Select your archive** in Organizer
2. **Click "Distribute App"**
3. **Select "App Store Connect"**
4. **Select "Upload"**
5. **Choose "Automatically manage signing"**
6. **Review and click "Upload"**
7. Wait for validation and upload (5-15 minutes)

## Post-Upload

### 8. Configure TestFlight

1. **Go to App Store Connect** → Your App → TestFlight
2. **Wait for processing** (10-60 minutes)
3. **Add test information** (What to Test)
4. **Add internal testers** (up to 100)
5. **Configure external testing** (if needed)

### 9. Release Notes

Prepare release notes:
```
## What's New

- Fixed NIP-05 verification on iOS (checkmarks now appear for verified profiles)
- Improved safe area handling (no UI overlap on devices with notch)
- Better network handling for domain verification
- Various UI improvements and bug fixes
```

## Current Configuration

- **Bundle ID**: `com.flotilla.anmore`
- **App Name**: Flotilla Chat
- **Display Name**: Flotilla
- **Icons**: ✅ Present in Assets.xcassets
- **Splash Screens**: ✅ Present in Assets.xcassets
- **NIP-05 Verification**: ✅ Fixed (uses CapacitorHttp on iOS)
- **Safe Area**: ✅ Fixed (contentInset: automatic)
- **Relay Connection**: ✅ Configured (wss://relay.anmore.me)

## Important Notes

1. **Build Number Must Be Unique**: Increment for each upload
2. **Test Locally First**: Always test on physical device before uploading
3. **Processing Time**: Build processing takes 10-60 minutes
4. **First External Build**: Requires App Store review (24-48 hours)
5. **Icons**: App icon must be 1024x1024 PNG (already configured ✅)

## Troubleshooting

If upload fails:
- Clean build folder: `Cmd+Shift+K`
- Delete derived data: Xcode → Preferences → Locations
- Verify signing in Xcode
- Check bundle ID matches App Store Connect exactly

See `TESTFLIGHT_DEPLOYMENT.md` for detailed instructions.

