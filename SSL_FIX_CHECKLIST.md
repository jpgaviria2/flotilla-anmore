# SSL Certificate Fix Checklist

## Current Status
❌ **SSL Still Not Working** - Certificate reinstall didn't resolve the issue

## Error Details
- **Error**: TLS alert internal error (alert 80)
- **Symptom**: "no peer certificate available"
- **Server**: Caddy detected
- **Connection**: Port 443 accepts connections but SSL handshake fails

## Possible Issues

### 1. Certificate Not Fully Activated
- Certificate may be installed but not yet active
- **Wait**: SSL certificates can take 5-15 minutes to propagate
- **Check**: Hostinger control panel → SSL status should show "Active"

### 2. Certificate/Key Mismatch
- Certificate installed but private key doesn't match
- **Fix**: Reinstall certificate ensuring key pair matches

### 3. Caddy Configuration Issue
If using Caddy, the configuration might need updating:

**Check Caddyfile:**
```bash
# SSH into server
cat /etc/caddy/Caddyfile
```

**Should contain:**
```
anmore.me {
    tls {
        # Auto-provision or specify certificate
    }
    root * /path/to/public_html
    file_server
    try_files {path} /index.html
}
```

**Reload Caddy:**
```bash
caddy reload --config /etc/caddy/Caddyfile
# OR
systemctl reload caddy
```

### 4. Wrong Domain in Certificate
- Certificate might be for different domain
- **Check**: Certificate should be for `anmore.me` (not `www.anmore.me` or other)

### 5. Certificate Not Bound to Port 443
- Certificate exists but not configured for HTTPS
- **Check**: Hostinger SSL settings → Ensure certificate is bound to domain

## Step-by-Step Fix

### Option A: Hostinger Control Panel
1. Log into Hostinger
2. Go to **SSL/TLS** section
3. Find `anmore.me` domain
4. Check certificate status:
   - Should show "Active" or "Installed"
   - If "Pending" → Wait 10-15 minutes
   - If "Error" → Click "Retry" or "Reinstall"
5. If certificate shows active but site still fails:
   - Click "Reinstall" or "Renew"
   - Wait 10-15 minutes
   - Test again

### Option B: Manual Certificate (If you have access)
1. SSH into server
2. Check certificate location:
   ```bash
   ls -la /etc/ssl/certs/ | grep anmore
   ls -la /etc/ssl/private/ | grep anmore
   ```
3. Verify certificate:
   ```bash
   openssl x509 -in /path/to/cert.pem -text -noout
   ```
4. Check Caddy/nginx config
5. Restart web server

### Option C: Let's Encrypt Auto (Recommended)
If using Caddy, it should auto-provision Let's Encrypt certificates:

1. Ensure Caddyfile has:
   ```
   anmore.me {
       # Caddy will auto-provision SSL
       root * /path/to/public_html
       file_server
       try_files {path} /index.html
   }
   ```

2. Reload Caddy:
   ```bash
   caddy reload
   ```

3. Check Caddy logs:
   ```bash
   journalctl -u caddy -f
   # OR
   tail -f /var/log/caddy/access.log
   ```

## Verification Commands

After fixing, test with:

```bash
# Should show certificate details
openssl s_client -connect anmore.me:443 -servername anmore.me

# Should return HTTP 200 or 301
curl -I https://anmore.me

# Should load HTML
curl https://anmore.me
```

## Expected Output (When Working)

**openssl s_client should show:**
```
CONNECTED(00000005)
---
Certificate chain
 0 s:CN = anmore.me
   i:C = US, O = Let's Encrypt, CN = R13
---
Server certificate
-----BEGIN CERTIFICATE-----
[...certificate data...]
-----END CERTIFICATE-----
---
Verify return code: 0 (ok)
```

**curl should show:**
```
HTTP/2 200
# OR
HTTP/1.1 200 OK
```

## Next Steps

1. **Wait 10-15 minutes** if certificate was just installed (propagation delay)
2. **Check Hostinger SSL status** - verify it shows "Active"
3. **Check Caddy/Server logs** for SSL-related errors
4. **Try reinstalling** certificate again if still not working
5. **Contact Hostinger support** if issue persists

## If Still Not Working After 15 Minutes

The issue might be:
- Server configuration problem (Caddy/nginx misconfigured)
- Firewall blocking SSL handshake
- Certificate installed but not bound to correct domain/port
- Need to restart web server after certificate installation

**Action**: Contact Hostinger support with:
- Domain: anmore.me
- Error: TLS alert internal error (alert 80)
- Status: Certificate reinstalled but SSL handshake still failing

