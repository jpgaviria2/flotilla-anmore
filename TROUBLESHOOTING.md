# Troubleshooting Guide for anmore.me

## Common Issues: "No Data Loading"

### 1. Check Browser Console
Open browser DevTools (F12) and check the Console tab for errors:
- **CORS errors**: `Access to fetch at 'wss://relay.anmore.me' from origin 'https://anmore.me' has been blocked`
- **WebSocket errors**: `WebSocket connection failed`
- **Network errors**: Failed to load resources

### 2. Verify Relay Connection
The app connects to `wss://relay.anmore.me`. Check if:
- The relay is running and accessible
- WebSocket connections are allowed
- CORS is properly configured on the relay

**Test relay connection:**
```javascript
// Run in browser console on anmore.me
const ws = new WebSocket('wss://relay.anmore.me');
ws.onopen = () => console.log('✅ Relay connected');
ws.onerror = (e) => console.error('❌ Relay error:', e);
ws.onclose = (e) => console.log('Relay closed:', e.code, e.reason);
```

### 3. Check Network Tab
In DevTools → Network tab:
- Look for failed requests (red status codes)
- Check if `/_app/immutable/entry/start.DP-A3T4P.js` loads successfully
- Verify WebSocket connections appear in the WS filter

### 4. Service Worker Issues
The app uses a service worker. Check:
- Service Worker registration in Application tab → Service Workers
- Clear service worker cache: Application tab → Clear storage → Clear site data
- Unregister service worker if causing issues

### 5. Environment Variables
The app is hardcoded to use `wss://relay.anmore.me`, so environment variables shouldn't affect data loading. However, check:
- `build/_app/env.js` should exist (can be empty for static builds)

### 6. CORS Configuration
If you see CORS errors, the relay server needs to allow requests from `https://anmore.me`. The relay needs:
```
Access-Control-Allow-Origin: https://anmore.me
Access-Control-Allow-Methods: GET, POST, OPTIONS
```

### 7. WebSocket Connection Test
Run this in the browser console to test the relay:
```javascript
// Test WebSocket connection
const testRelay = async () => {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('wss://relay.anmore.me');
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('Connection timeout'));
    }, 5000);
    
    ws.onopen = () => {
      clearTimeout(timeout);
      console.log('✅ WebSocket connected');
      // Send a REQ message
      ws.send(JSON.stringify(['REQ', 'test', {kinds: [1], limit: 1}]));
      setTimeout(() => {
        ws.close();
        resolve(true);
      }, 2000);
    };
    
    ws.onerror = (e) => {
      clearTimeout(timeout);
      console.error('❌ WebSocket error:', e);
      reject(e);
    };
    
    ws.onmessage = (e) => {
      console.log('📨 Received:', e.data);
    };
  });
};

testRelay().then(() => console.log('Relay test passed')).catch(e => console.error('Relay test failed:', e));
```

### 8. Check Application State
In browser console, check if the app initialized:
```javascript
// Check if repository exists
console.log('Repository:', window.repository ? '✅ Found' : '❌ Missing');

// Check if relay is loaded
console.log('Relay loaded:', window.loadRelay ? '✅ Found' : '❌ Missing');
```

### 9. Common Fixes

#### Clear All Caches
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Clear site data"
4. Refresh the page

#### Disable Service Worker Temporarily
1. Application tab → Service Workers
2. Click "Unregister"
3. Refresh page

#### Check File Permissions
On Hostinger, ensure all files have correct permissions:
- Files: 644
- Directories: 755

#### Verify .htaccess
Ensure `.htaccess` is in the root directory and contains the SPA routing rules.

### 10. Debug Mode
Add this to browser console to see detailed logs:
```javascript
localStorage.setItem('debug', 'true');
location.reload();
```

## Quick Diagnostic Checklist

- [ ] Browser console shows no errors
- [ ] Network tab shows successful JS/CSS loads
- [ ] WebSocket connection to relay succeeds
- [ ] Service worker is registered (or disabled)
- [ ] No CORS errors in console
- [ ] `.htaccess` file exists in root
- [ ] All build files uploaded correctly
- [ ] SSL certificate is valid

## Still Not Working?

1. **Check relay server logs** - Verify `wss://relay.anmore.me` is running
2. **Test relay directly** - Use a Nostr client to verify relay has data
3. **Check Hostinger error logs** - Look for server-side errors
4. **Verify DNS** - Ensure `anmore.me` resolves correctly
5. **Test from different network** - Rule out firewall/proxy issues

## Expected Behavior

When working correctly:
- Page loads without errors
- Feed shows NOTE events (kind 1)
- Marketplace shows listings (kinds 30017, 30018, 30402)
- Calendar shows events (kind 31923)
- Fundraising shows goals (kind 9041)
- WebSocket connection shows as "open" in Network tab
