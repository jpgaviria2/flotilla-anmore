# Bundle Identifier Change

## Updated Bundle Identifier

The bundle identifier has been changed from `social.flotilla` to `com.flotilla.anmore` because the original identifier was already registered to another development team.

## Files Updated

1. ✅ **capacitor.config.ts** - Changed `appId` to `com.flotilla.anmore`
2. ✅ **ios/App/App.xcodeproj/project.pbxproj** - Updated `PRODUCT_BUNDLE_IDENTIFIER` (Debug and Release configurations)
3. ✅ **ios/App/App/capacitor.config.json** - Regenerated with new bundle ID via `cap sync`

## Next Steps

1. **In Xcode**: The bundle identifier should now be `com.flotilla.anmore`
   - You may need to close and reopen Xcode for the changes to be fully recognized
   - Go to: Project Settings > Target "Flotilla Chat" > Signing & Capabilities
   - Verify the Bundle Identifier shows `com.flotilla.anmore`

2. **Try Building Again**: 
   - Select your simulator or device
   - Press `Cmd+R` to build and run
   - The bundle identifier should now register successfully

## Customizing the Bundle Identifier

If you want to use a different bundle identifier:

1. Update `capacitor.config.ts`:
   ```typescript
   appId: 'your.unique.bundle.id'
   ```

2. Update the Xcode project:
   - In Xcode: Project Settings > Target "Flotilla Chat" > General > Bundle Identifier
   - Or manually edit `ios/App/App.xcodeproj/project.pbxproj` and replace `com.flotilla.anmore` with your identifier

3. Resync Capacitor:
   ```bash
   npx cap sync ios
   ```

## Android Bundle ID (Optional)

Note: The Android app still uses `social.flotilla` as the package name. If you want consistency across platforms, you would need to:

1. Update `android/app/build.gradle`:
   - Change `namespace "social.flotilla"` to your desired package
   - Change `applicationId "social.flotilla"` to match

2. Update Java package in `android/app/src/main/java/`
   - Rename package directory from `social/flotilla` to match new package name
   - Update package declaration in `MainActivity.java`

3. Update Android manifest and other references

This is optional - iOS and Android can have different bundle identifiers if needed.

