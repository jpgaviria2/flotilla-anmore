# iOS NIP-05 Verification Debug Guide

## Current Status

The NIP-05 verification is failing in iOS with error: `TypeError: Load failed`

## What's Configured

1. **Info.plist** has `NSAllowsArbitraryLoadsInWebContent: true` - This should allow WebView to fetch from any HTTPS domain
2. **Error handling** now properly catches "Load failed" errors from iOS WebView
3. **Timeout handling** uses AbortController (compatible with both PWA and iOS)

## The Issue

The fetch to `https://anmore.me/.well-known/nostr.json?name=jp` is failing with "Load failed" in iOS WebView, even though:
- The URL is accessible (curl works)
- The PWA works correctly
- `NSAllowsArbitraryLoadsInWebContent` is set

## Possible Causes

1. **App needs rebuild**: Info.plist changes require a clean rebuild
2. **WebView caching**: iOS WebView might be caching old network restrictions
3. **Network stack**: iOS WebView uses a different network stack than Safari

## Next Steps

### 1. Clean Rebuild in Xcode

1. **Quit Xcode completely** (Cmd+Q)
2. **Delete derived data**:
   - Xcode → Preferences → Locations → Derived Data → Click arrow to open in Finder
   - Delete the `DerivedData` folder
3. **Clean build folder**: `Cmd+Shift+K` in Xcode
4. **Rebuild**: `Cmd+R`

### 2. Test in Safari Web Inspector

1. Connect iOS device/simulator
2. Safari → Develop → [Your Device] → Flotilla Chat
3. Open Web Inspector console
4. Try the fetch manually:
   ```javascript
   fetch('https://anmore.me/.well-known/nostr.json?name=jp')
     .then(r => r.json())
     .then(d => console.log('Success:', d))
     .catch(e => console.error('Error:', e))
   ```

### 3. Check Network Tab

In Safari Web Inspector:
- Network tab → Filter: Fetch/XHR
- Look for the request to `anmore.me`
- Check if it's blocked, timing out, or returning an error

### 4. Verify Info.plist is Applied

In Xcode:
1. Open `ios/App/App/Info.plist`
2. Verify `NSAllowsArbitraryLoadsInWebContent` is `true`
3. Check if there are any duplicate or conflicting entries

## Alternative Solutions

If the issue persists after clean rebuild:

### Option 1: Add Domain to Exception Domains

Even with `NSAllowsArbitraryLoadsInWebContent`, you might need to explicitly allow the domain:

```xml
<key>anmore.me</key>
<dict>
  <key>NSExceptionAllowsInsecureHTTPLoads</key>
  <false/>
  <key>NSExceptionRequiresForwardSecrecy</key>
  <true/>
  <key>NSIncludesSubdomains</key>
  <true/>
</dict>
```

(Already done, but verify it's correct)

### Option 2: Check Capacitor iOS Configuration

The issue might be in Capacitor's iOS configuration. Check:
- `capacitor.config.ts` - iOS settings
- `ios/App/App/AppDelegate.swift` - WebView configuration

### Option 3: Use Capacitor HTTP Plugin

As a last resort, we could use Capacitor's HTTP plugin instead of fetch for iOS:

```typescript
import { CapacitorHttp } from '@capacitor/core'

// For iOS, use Capacitor HTTP
if (Capacitor.getPlatform() === 'ios') {
  const response = await CapacitorHttp.get({
    url: url,
    headers: { Accept: 'application/json' }
  })
}
```

But this should not be necessary since `NSAllowsArbitraryLoadsInWebContent` should work.

## Current Code Status

The verification code now:
- ✅ Works in PWA (tested and working)
- ✅ Uses AbortController for timeout (compatible with both)
- ✅ Handles "Load failed" errors from iOS WebView
- ✅ Doesn't cache network errors (will retry)

## Expected Behavior After Fix

When working correctly, you should see in Xcode console:

```
verifyNip05Domain: Fetching https://anmore.me/.well-known/nostr.json?name=jp
verifyNip05Domain: Response status: 200
verifyNip05Domain: Response data: {...}
verifyNip05Domain: Verification check - endpoint pubkey: ... match: true
isNip05Verified: Domain verification result: true
ProfileName: Verification result: true
```

## Related Files

- `ios/App/App/Info.plist` - App Transport Security
- `src/app/util/verification.ts` - Verification logic
- `capacitor.config.ts` - Capacitor iOS config

