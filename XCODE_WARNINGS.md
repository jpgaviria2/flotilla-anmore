# Xcode Build Warnings

This document explains the warnings you may see when building the iOS app and whether they need to be addressed.

## ✅ Fixed Warnings

### 1. Unassigned Splash Images
**Status**: Fixed
- **Issue**: Three unused splash image files were present in the Splash.imageset
- **Files**: `splash-2732x2732-1.png`, `splash-2732x2732-2.png`, `splash-2732x2732.png`
- **Solution**: Removed unused files (only the Default@*x~universal~anyany*.png files are needed)

## ⚠️ Safe to Ignore Warnings

### 1. CocoaPods Script Phase Warnings

```
Run script build phase '[CP] Embed Pods Frameworks' will be run during every build
Run script build phase '[CP] Copy XCFrameworks' will be run during every build
```

**Status**: Safe to ignore - CocoaPods standard behavior
- **Why**: CocoaPods script phases don't specify outputs by design to ensure dependencies are always properly linked
- **Impact**: None - this is expected behavior
- **Action**: No action needed

**If you want to suppress these warnings** (optional):
1. In Xcode, go to your Target > Build Phases
2. Find the `[CP] Embed Pods Frameworks` script
3. Uncheck "Based on dependency analysis"
4. Repeat for `[CP] Copy XCFrameworks` if present

### 2. Capacitor Plugin Warnings

#### CapacitorFilesystem Warning
```
Initialization of immutable value 'responseType' was never used
```

**Status**: Safe to ignore - Third-party dependency
- **Location**: `@capacitor/filesystem` plugin
- **Impact**: None - This is in a dependency, not your code
- **Action**: No action needed (will be fixed when plugin updates)

#### CapacitorPushNotifications Warning
```
'alert' was deprecated in iOS 14.0
```

**Status**: Safe to ignore - Third-party dependency
- **Location**: `@capacitor/push-notifications` plugin
- **Impact**: Minimal - Deprecated API but still works on iOS 14+
- **Action**: No action needed (will be fixed when plugin updates)

## Summary

- ✅ **Fixed**: Unassigned splash images
- ✅ **Safe to ignore**: CocoaPods script phase warnings
- ✅ **Safe to ignore**: Third-party plugin warnings

All of these warnings are cosmetic and don't affect the app's functionality. The build should complete successfully despite these warnings.

## Building the App

Despite these warnings, you can successfully build and run the app:
1. Select your simulator or device
2. Press `Cmd+R` to build and run
3. The app will function normally

If you encounter any **errors** (not warnings), those need to be addressed. Warnings like these are informational and don't prevent the app from building or running.

