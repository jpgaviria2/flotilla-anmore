# Comprehensive Troubleshooting Guide for anmore.me

## Current Status
- ✅ DNS resolves: `anmore.me` → 209.53.47.42, `relay.anmore.me` → 209.53.47.45
- ✅ Ports open: 443, 80 on both domains
- ❌ HTTPS/TLS: Certificate or handshake issues preventing site access
- ❓ WebSocket: Cannot test until HTTPS works

## Critical Issues Found

### 1. SSL/TLS Certificate Problem (BLOCKING)
**Symptom**: `curl: (35) ... tlsv1 alert internal error`
**Impact**: Site completely inaccessible, no data can load

**Fix Steps**:
1. **Check Hostinger SSL Certificate**:
   - Log into Hostinger control panel
   - Go to SSL/TLS settings
   - Verify certificate exists for `anmore.me`
   - Check expiration date
   - If expired or missing, renew/install certificate

2. **If using Caddy** (server shows "Server: Caddy"):
   ```bash
   # SSH into server and check Caddy config
   caddy validate --config /etc/caddy/Caddyfile
   caddy reload --config /etc/caddy/Caddyfile
   ```

3. **If using Let's Encrypt**:
   - Certificate may need renewal
   - Check: `certbot certificates`
   - Renew if needed: `certbot renew`

4. **Verify Certificate**:
   ```bash
   openssl s_client -connect anmore.me:443 -servername anmore.me
   ```
   Should show full certificate chain, not "no peer certificate available"

### 2. Relay Connection (After SSL Fixed)
**Test WebSocket**:
```javascript
// Run in browser console on https://anmore.me
const ws = new WebSocket('wss://relay.anmore.me');
ws.onopen = () => console.log('✅ Connected');
ws.onerror = (e) => console.error('❌ Error:', e);
ws.onclose = (e) => console.log('Closed:', e.code, e.reason);
```

**If WebSocket fails**:
- Check relay server is running
- Verify firewall allows WebSocket connections
- Check relay logs for connection attempts
- Ensure relay accepts connections from `anmore.me`

### 3. Application Initialization
The app should:
1. Load `index.html`
2. Load `/_app/immutable/entry/start.DP-A3T4P.js`
3. Call `syncApplicationData()` which:
   - Calls `syncRelays()` → `loadRelay(ANMORE_RELAY)`
   - Calls `syncSpaces()` → `syncSpace(ANMORE_RELAY)`

**Check in Browser Console**:
```javascript
// After page loads
console.log('Repository:', window.repository ? '✅' : '❌');
console.log('Relay loaded:', window.loadRelay ? '✅' : '❌');
console.log('ANMORE_RELAY:', window.ANMORE_RELAY);
```

### 4. Data Not Loading - Common Causes

#### A. Relay Not Syncing
**Check**: Browser console for errors like:
- `WebSocket connection failed`
- `Failed to load relay`
- `CORS policy blocked`

**Fix**: 
- Verify `wss://relay.anmore.me` is accessible
- Check relay server logs
- Ensure relay has data (test with another Nostr client)

#### B. Feed Not Showing Events
**Check**: 
```javascript
// In browser console
const events = window.repository.query([{kinds: [1]}]);
console.log('NOTE events:', events.length);
```

**If 0 events**:
- Relay may be empty
- Relay may not be syncing properly
- Check `syncSpace` is being called for `ANMORE_RELAY`

#### C. Service Worker Issues
**Check**: DevTools → Application → Service Workers
- Should see registered service worker
- If not, check console for registration errors

**Fix**:
- Unregister service worker
- Clear cache
- Reload page

### 5. File Access Issues
**Test**: Visit these URLs directly:
- `https://anmore.me/index.html`
- `https://anmore.me/_app/immutable/entry/start.DP-A3T4P.js`
- `https://anmore.me/diagnostic.html`

**If 404**:
- Files not uploaded correctly
- Wrong directory structure
- `.htaccess` routing issue

### 6. .htaccess Configuration
Ensure `.htaccess` exists in root with:
```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

## Step-by-Step Fix Process

### Step 1: Fix SSL/TLS (CRITICAL)
1. Access Hostinger control panel
2. Check SSL certificate status
3. Renew/install if needed
4. Test: `curl -I https://anmore.me` should return 200/301

### Step 2: Verify Site Loads
1. Visit `https://anmore.me`
2. Should see app interface (even if no data)
3. Open browser console (F12)
4. Check for JavaScript errors

### Step 3: Test Diagnostic Page
1. Visit `https://anmore.me/diagnostic.html`
2. Review test results
3. Note which tests fail

### Step 4: Check Relay Connection
1. In browser console, test WebSocket:
   ```javascript
   const ws = new WebSocket('wss://relay.anmore.me');
   ws.onopen = () => console.log('✅ Connected');
   ws.onerror = (e) => console.error('❌', e);
   ```
2. If fails, check relay server

### Step 5: Verify Data Sync
1. Check console for sync errors
2. Verify `syncApplicationData()` is called
3. Check if `loadRelay(ANMORE_RELAY)` succeeds
4. Verify events are being loaded

## Quick Diagnostic Commands

### From Server (SSH):
```bash
# Check SSL certificate
openssl s_client -connect anmore.me:443 -servername anmore.me

# Check if relay is running
curl -I https://relay.anmore.me

# Check file permissions
ls -la /path/to/public_html/

# Check .htaccess exists
cat /path/to/public_html/.htaccess
```

### From Browser Console:
```javascript
// Check app state
console.log('ANMORE_RELAY:', window.ANMORE_RELAY);
console.log('Repository events:', window.repository?.query([{kinds: [1]}]).length);

// Test relay connection
const ws = new WebSocket('wss://relay.anmore.me');
ws.onopen = () => console.log('✅ Connected');
ws.onerror = (e) => console.error('❌', e);
ws.onmessage = (e) => console.log('📨', e.data);
```

## Expected Behavior When Working

1. **Page Loads**: `https://anmore.me` shows app interface
2. **No Console Errors**: Browser console is clean
3. **Relay Connects**: WebSocket to `wss://relay.anmore.me` opens
4. **Data Loads**: Feed shows NOTE events (kind 1)
5. **Service Worker**: Registered and active
6. **Navigation Works**: Can navigate between Feed, Marketplace, Calendar, etc.

## If Still Not Working

1. **Check Hostinger Error Logs**: Look for server-side errors
2. **Check Relay Logs**: Verify relay is receiving connections
3. **Test with Different Browser**: Rule out browser-specific issues
4. **Test from Different Network**: Rule out firewall/proxy
5. **Verify Build Files**: Ensure all files from `build-hostinger.zip` are uploaded

## Contact Points

- **Hostinger Support**: For SSL/certificate issues
- **Relay Admin**: For relay connection issues
- **Browser DevTools**: For client-side debugging

