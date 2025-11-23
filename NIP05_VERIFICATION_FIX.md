# NIP-05 Verification Fix for iOS

## Issue

NIP-05 verification was not working in the iOS app. The checkmark next to verified profile names was not appearing, even when profiles had valid NIP-05 identifiers.

## Root Cause

The NIP-05 verification process requires fetching from arbitrary domains (e.g., `https://example.com/.well-known/nostr.json` for a NIP-05 like `user@example.com`). 

iOS App Transport Security (ATS) was configured to only allow connections to specific exception domains (`relay.anmore.me` and `anmore.me`). This blocked NIP-05 verification requests to other domains made from the WebView.

## Fix Applied

Added `NSAllowsArbitraryLoadsInWebContent` to `Info.plist`:

```xml
<key>NSAllowsArbitraryLoadsInWebContent</key>
<true/>
```

This allows the WebView (where the JavaScript code runs) to make HTTPS requests to arbitrary domains, while still maintaining security for native code connections.

## What This Does

- **Allows WebView to fetch from any HTTPS domain**: NIP-05 verification can now fetch from `https://example.com/.well-known/nostr.json` or any other domain
- **Maintains security**: Native code connections still follow strict ATS rules
- **Safe for NIP-05 verification**: Only allows HTTPS (secure) connections, not HTTP

## How NIP-05 Verification Works

1. **User has NIP-05**: Profile has `nip05` field (e.g., `user@example.com`)
2. **Extract domain**: Extract domain from NIP-05 (`example.com`)
3. **Fetch verification file**: Request `https://example.com/.well-known/nostr.json?name=user`
4. **Verify pubkey**: Check if the pubkey in `nostr.json` matches the profile's pubkey
5. **Show checkmark**: If verified, display checkmark next to the name

## Testing

To test if NIP-05 verification is working:

1. **Rebuild the app**:
   - Clean build folder: `Cmd+Shift+K` in Xcode
   - Rebuild: `Cmd+R`

2. **Check console logs**:
   - Look for `verifyNip05Domain: Fetching` messages in Xcode console
   - Look for `ProfileName: Verification result:` messages
   - Check for any network errors

3. **Test with a verified profile**:
   - Find a profile with a NIP-05 (e.g., `user@example.com`)
   - The checkmark should appear next to the name if verification succeeds

## Debugging

If verification still doesn't work:

1. **Check Xcode Console** for errors:
   ```
   verifyNip05Domain: Fetching https://example.com/.well-known/nostr.json?name=user
   verifyNip05Domain: Response status: 200
   verifyNip05Domain: Verification result: true
   ```

2. **Common issues**:
   - **Network errors**: Check if domain is accessible
   - **CORS errors**: Should not apply in native app (WebView)
   - **Invalid JSON**: Check if `nostr.json` file is valid
   - **Wrong pubkey**: Check if pubkey in `nostr.json` matches profile

3. **Test a known verified profile**:
   - Use a profile you know has a valid NIP-05
   - Check the domain's `.well-known/nostr.json` file in a browser
   - Verify the pubkey matches

## Security Considerations

The `NSAllowsArbitraryLoadsInWebContent` setting:
- ✅ **Allows HTTPS only**: Only allows secure connections
- ✅ **WebView only**: Applies only to WebView content, not native code
- ✅ **Necessary for NIP-05**: Required for NIP-05 verification to work with arbitrary domains
- ⚠️ **WebView security**: WebView content can make HTTPS requests to any domain (expected for web apps)

This is a standard configuration for hybrid apps (like Capacitor) that need to fetch from arbitrary domains.

## Related Files

- `ios/App/App/Info.plist` - App Transport Security configuration
- `src/app/util/verification.ts` - NIP-05 verification logic
- `src/app/components/ProfileName.svelte` - Component that displays verification checkmark
- `src/app/components/VerifiedIcon.svelte` - Checkmark icon component

