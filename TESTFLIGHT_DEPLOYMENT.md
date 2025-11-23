# TestFlight Deployment Guide

This guide covers how to deploy the iOS app to TestFlight for beta testing.

## Prerequisites

1. **Apple Developer Account** (paid membership required - $99/year)
   - Active Apple Developer Program enrollment
   - Access to [App Store Connect](https://appstoreconnect.apple.com/)

2. **Xcode** (latest version recommended)
   - Ensure you're signed in with your Apple ID in Xcode

3. **App Store Connect Setup**
   - Your app must be registered in App Store Connect
   - Bundle ID must match: `com.flotilla.anmore`

## Step 1: Register Your App in App Store Connect

1. **Go to App Store Connect**: https://appstoreconnect.apple.com/
2. **Click "My Apps"** → **"+"** → **"New App"**
3. **Fill in the app information**:
   - **Platform**: iOS
   - **Name**: Flotilla (or your app name)
   - **Primary Language**: English (or your preferred language)
   - **Bundle ID**: `com.flotilla.anmore` (must match exactly)
   - **SKU**: A unique identifier (e.g., `flotilla-anmore-ios`)
   - **User Access**: Full Access (recommended)
4. **Click "Create"**

## Step 2: Configure App Information

1. **App Information Tab**:
   - Fill in category, subcategory
   - Add support URL (your website)
   - Add marketing URL (if applicable)

2. **Pricing and Availability**:
   - Set price (free or paid)
   - Select availability countries

3. **App Privacy**:
   - Complete privacy questionnaire
   - Describe data collection and usage

## Step 3: Prepare Your App for Archive

### 3.1 Update Version Numbers

In Xcode:
1. Select your project in the navigator
2. Select the "Flotilla Chat" target
3. Go to **General** tab
4. Set:
   - **Version**: Current version (e.g., `1.5.3`)
   - **Build**: Build number (e.g., `25` or increment it)
   - **Note**: Build number must be unique for each upload

### 3.2 Configure Signing

1. Go to **Signing & Capabilities** tab
2. **Check "Automatically manage signing"**
3. **Select your Team** from the dropdown
   - Must be a team with App Store distribution capability
4. **Verify Bundle Identifier**: `com.flotilla.anmore`

### 3.3 Set Build Configuration to Release

1. In Xcode toolbar, check the scheme selector
2. Make sure it shows **"Any iOS Device"** (not a simulator)
3. Product → Scheme → Edit Scheme
4. Select **"Archive"** in the left sidebar
5. Set **Build Configuration** to **"Release"**

## Step 4: Archive Your App

1. **Select "Any iOS Device"** from the device dropdown in Xcode toolbar
   - Or select **"Generic iOS Device"**
   - Do NOT select a simulator

2. **Archive the app**:
   - Menu: **Product** → **Archive**
   - Or press `Cmd+Shift+B` (if scheme is set correctly)
   - Or press `Cmd+B` to build first, then **Product** → **Archive**

3. **Wait for archive to complete**
   - This may take several minutes
   - Xcode will open the **Organizer** window when done

## Step 5: Validate and Upload to App Store Connect

### 5.1 In the Organizer Window

1. **Select your archive** (should be the latest one)
2. **Click "Distribute App"**
3. **Select distribution method**:
   - Choose **"App Store Connect"**
   - Click **"Next"**

### 5.2 Select Distribution Options

1. **Select "Upload"**
   - Click **"Next"**

### 5.3 App Thinning and Distribution

1. **Select "Automatically manage signing"**
   - Or manually select provisioning profiles if needed
   - Click **"Next"**

### 5.4 Review and Upload

1. **Review your app information**:
   - Verify bundle ID, version, and build number
   - Check signing certificates

2. **Click "Upload"**
   - This will validate and upload your app
   - May take 5-15 minutes depending on size

3. **Wait for validation/upload to complete**
   - You'll see progress and any errors
   - Fix any issues if validation fails

## Step 6: Configure TestFlight Build

### 6.1 In App Store Connect

1. **Go to your app** in App Store Connect
2. **Click "TestFlight"** tab
3. **Wait for processing**:
   - Your build will appear under "iOS Builds" after processing
   - Processing typically takes 10-60 minutes
   - You'll receive an email when processing is complete

### 6.2 Add Test Information (Optional but Recommended)

1. **Click on your build** once it's processed
2. **Add "What to Test"**:
   - Describe what testers should focus on
   - List known issues
   - Provide testing instructions

## Step 7: Add Internal Testers

### 7.1 Add Internal Testers

1. **Go to TestFlight tab** → **Internal Testing**
2. **Click "+"** to add testers
3. **Select testers**:
   - Must be part of your App Store Connect team
   - Limited to 100 internal testers

### 7.2 Configure Testing Groups (Optional)

1. **Create a testing group** (e.g., "Beta Testers")
2. **Add your build** to the group
3. **Invite testers** to the group
4. **Testers receive email** with TestFlight invitation

## Step 8: Distribute to External Testers (Beta Testing)

### 8.1 Add External Testers

1. **Go to TestFlight tab** → **External Testing**
2. **Create a new group** (e.g., "Beta Testers")
3. **Add your build** to the group
4. **Configure testing information**:
   - Build number
   - What to Test notes
   - Test Information

### 8.2 Submit for Beta App Review

1. **Fill in required information**:
   - Answer App Review questions
   - Provide demo account if needed
   - Add notes for reviewers

2. **Submit for Review**
   - First external build requires App Store review
   - Review typically takes 24-48 hours
   - Subsequent updates are usually faster

3. **Once approved**, external testers can download and test

## Troubleshooting

### Build Errors

**Issue**: "No matching provisioning profile found"
- **Solution**: Ensure "Automatically manage signing" is checked and your team is selected

**Issue**: "Bundle identifier conflicts"
- **Solution**: Verify bundle ID matches App Store Connect exactly (`com.flotilla.anmore`)

**Issue**: "Invalid architecture"
- **Solution**: Make sure you're archiving for a device, not simulator

### Upload Errors

**Issue**: "Invalid Bundle" or validation errors
- **Solution**: 
  - Check Info.plist for required keys
  - Verify app icons are present
  - Check that version/build numbers are valid

**Issue**: "Code signing errors"
- **Solution**:
  - Clean build folder: `Cmd+Shift+K`
  - Delete derived data: Xcode → Preferences → Locations → Derived Data → Delete
  - Re-archive

### TestFlight Issues

**Issue**: Build stuck in "Processing"
- **Solution**: Wait up to 60 minutes. If longer, check email for any issues or contact Apple Support

**Issue**: Build fails processing
- **Solution**: 
  - Check email for specific errors
  - Verify app doesn't use private APIs
  - Check for missing required entitlements

## Quick Reference Commands

### Build from Command Line (Alternative)

```bash
cd ios/App

# Archive the app
xcodebuild -workspace App.xcworkspace \
  -scheme "Flotilla Chat" \
  -configuration Release \
  -archivePath build/Flotilla.xcarchive \
  archive

# Export for App Store
xcodebuild -exportArchive \
  -archivePath build/Flotilla.xcarchive \
  -exportPath build/export \
  -exportOptionsPlist ExportOptions.plist
```

### Create ExportOptions.plist

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
</dict>
</plist>
```

## Checklist Before Uploading

- [ ] Version number updated
- [ ] Build number incremented
- [ ] Bundle ID matches App Store Connect (`com.flotilla.anmore`)
- [ ] Signing configured correctly
- [ ] Archive built for device (not simulator)
- [ ] App tested locally
- [ ] No console errors or warnings
- [ ] All required assets present (icons, splash screens)
- [ ] Info.plist has all required keys
- [ ] Privacy policy URL configured (if required)

## Additional Resources

- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [TestFlight User Guide](https://developer.apple.com/testflight/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Xcode Organizer Documentation](https://developer.apple.com/documentation/xcode/organizing-your-app-s-binary-data-in-xcode)

## Current App Configuration

- **Bundle ID**: `com.flotilla.anmore`
- **App Name**: Flotilla Chat
- **Display Name**: Flotilla
- **Version**: 1.5.3 (check in Xcode to confirm)
- **Build**: 25 (increment for each upload)
- **Minimum iOS**: 14.0
- **Capacitor Version**: 7.4.3
- **Development Team**: Set in Xcode (Signing & Capabilities)

## Tips for Faster TestFlight Deployments

1. **Increment Build Number**: Each upload requires a new build number. Use date-based builds (e.g., `20251122`)

2. **Automate with Fastlane** (optional):
   ```bash
   # Install fastlane
   sudo gem install fastlane
   
   # Initialize in ios/App directory
   cd ios/App
   fastlane init
   
   # Then use: fastlane beta
   ```

3. **Test Locally First**: Always test on a physical device before uploading to TestFlight

4. **Keep Build Numbers Unique**: Never reuse build numbers - always increment

5. **App Store Connect Status Page**: Check https://developer.apple.com/system-status/ for any service issues before uploading

