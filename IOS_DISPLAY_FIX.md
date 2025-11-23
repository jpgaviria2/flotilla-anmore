# iOS Display Size and Relay Connection Fixes

## Issues Fixed

### 1. Display Size / Safe Area Issue

**Problem**: UI elements overlapping with status bar and notch (feed, "show unverified", "new thread" showing over camera and clock).

**Root Cause**: iOS safe area handling was not properly configured in Capacitor.

**Fixes Applied**:

1. **Updated `capacitor.config.ts`**:
   ```typescript
   ios: {
     scrollEnabled: true,
     contentInset: "automatic",
   }
   ```

2. **Viewport Meta Tag**: Already configured correctly in `app.html`:
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, interactive-widget=resizes-content" />
   ```

3. **Safe Area Plugin**: Already imported in `+layout.svelte`:
   ```typescript
   import "@capacitor-community/safe-area"
   ```

4. **CSS Variables**: Already configured in `app.css`:
   ```css
   --sait: var(--safe-area-inset-top, env(safe-area-inset-top));
   --saib: var(--safe-area-inset-bottom, env(safe-area-inset-bottom));
   --sail: var(--safe-area-inset-left, env(safe-area-inset-left));
   --sair: var(--safe-area-inset-right, env(safe-area-inset-right));
   ```

**What This Does**: The `contentInset: "automatic"` setting tells iOS to automatically add safe area insets, which will prevent content from overlapping with the status bar, notch, and home indicator.

### 2. Relay Connection Issue

**Problem**: App not getting data from `wss://relay.anmore.me`.

**Root Cause**: iOS App Transport Security (ATS) was blocking WebSocket connections to the relay.

**Fixes Applied**:

Added App Transport Security exception to `ios/App/App/Info.plist`:
```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSExceptionDomains</key>
  <dict>
    <key>relay.anmore.me</key>
    <dict>
      <key>NSExceptionRequiresForwardSecrecy</key>
      <true/>
    </dict>
    <key>anmore.me</key>
    <dict>
      <key>NSExceptionRequiresForwardSecrecy</key>
      <true/>
    </dict>
  </dict>
</dict>
```

**What This Does**: Allows secure WebSocket (WSS) connections to `relay.anmore.me` and `anmore.me` while maintaining security requirements.

## Next Steps

1. **Rebuild the app**:
   - In Xcode, press `Cmd+Shift+K` to clean build folder
   - Press `Cmd+R` to rebuild and run

2. **Test the fixes**:
   - **Display**: Check that UI elements no longer overlap with status bar/notch
   - **Relay Connection**: Check browser console in Xcode (View > Debug Area > Activate Console) for WebSocket connection logs
   - **Data Loading**: Verify that data appears in the feed

## Debugging Relay Connection

If data still doesn't load, check the Xcode console for:

1. **WebSocket connection errors**:
   ```
   WebSocket connection to 'wss://relay.anmore.me' failed
   ```

2. **Network errors**:
   ```
   Failed to fetch
   Network request failed
   ```

3. **Relay connection status**:
   - Open Safari Web Inspector (if using simulator) to see network requests
   - Check if WebSocket connections are being attempted
   - Verify relay is responding with proper CORS headers

## Additional Debugging

### Check if relay is accessible:
```javascript
// In Xcode console or Safari Web Inspector
const ws = new WebSocket('wss://relay.anmore.me');
ws.onopen = () => console.log('✅ Connected to relay');
ws.onerror = (e) => console.error('❌ Error:', e);
ws.onclose = (e) => console.log('Closed:', e.code, e.reason);
```

### Check safe area insets:
```javascript
// In console
console.log('Safe area insets:', {
  top: CSS.supports('padding-top: env(safe-area-inset-top)') ? getComputedStyle(document.documentElement).getPropertyValue('--sait') : 'not supported',
  bottom: CSS.supports('padding-bottom: env(safe-area-inset-bottom)') ? getComputedStyle(document.documentElement).getPropertyValue('--saib') : 'not supported'
});
```

## Related Files

- `capacitor.config.ts` - iOS configuration
- `ios/App/App/Info.plist` - App Transport Security settings
- `src/app.html` - Viewport meta tag
- `src/app.css` - Safe area CSS variables
- `src/routes/+layout.svelte` - Safe area plugin import
- `src/app/core/state.ts` - Relay URL configuration (line 149)

