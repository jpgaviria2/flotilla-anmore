# Anmore Production Deployment Guide

## Build Information
- Build Date: $(date)
- Build Size: ~14MB (compressed)
- Platform: Static Site (SvelteKit with adapter-static)

## Deployment Instructions for Hostinger

### 1. Extract the ZIP file
Extract `anmore-production-*.zip` to your web root directory (usually `public_html` or `www`).

### 2. File Structure
After extraction, your directory structure should look like:
```
public_html/
├── index.html
├── _app/
│   ├── immutable/
│   │   ├── assets/
│   │   ├── chunks/
│   │   └── nodes/
│   ├── env.js
│   └── version.json
├── fonts/
├── .well-known/
├── manifest.webmanifest
├── service-worker.js
├── sw.js
└── ... (other static files)
```

### 3. Server Configuration

#### Apache (.htaccess)
Create or update `.htaccess` in your web root with:
```apache
# Enable rewrite engine
RewriteEngine On

# Handle client-side routing (SPA fallback)
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Cache static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>

# Enable GZIP compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>
```

#### Nginx
Add to your Nginx configuration:
```nginx
location / {
  try_files $uri $uri/ /index.html;
}

# Cache static assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}
```

### 4. Environment Variables
The application uses environment variables that are baked into the build. If you need to change configuration, you'll need to rebuild.

Key variables (already set in build):
- `VITE_PLATFORM_URL`: https://anmore.me
- `VITE_PLATFORM_NAME`: Anmore
- `VITE_PLATFORM_ACCENT`: #7161FF
- Relay: wss://relay.anmore.me (hardcoded)

### 5. API Endpoints
The application includes a server-side API endpoint for email signup:
- `/api/signup` - Requires `RESEND_API_KEY` environment variable on the server

**Note**: For static hosting (like Hostinger shared hosting), you may need to:
1. Use Hostinger's Node.js hosting option, OR
2. Set up a separate API server for the `/api/signup` endpoint

### 6. SSL/HTTPS
Ensure your domain has SSL enabled. The application requires HTTPS for:
- Service Worker registration
- Web Push Notifications
- Secure WebSocket connections (wss://)

### 7. CORS Configuration
If you encounter CORS issues with the relay (`wss://relay.anmore.me`), you may need to configure CORS headers on the relay server, not the static site.

### 8. Testing
After deployment:
1. Visit your domain
2. Check browser console for errors
3. Test signup flow (if API is configured)
4. Test calendar event indicators
5. Verify service worker registration

### 9. Troubleshooting

#### Service Worker not registering
- Ensure HTTPS is enabled
- Check browser console for errors
- Verify `sw.js` and `service-worker.js` are accessible

#### API endpoint not working
- Verify Node.js is enabled on Hostinger
- Check server logs for errors
- Ensure `RESEND_API_KEY` is set in server environment

#### Calendar indicators not showing
- Clear browser cache
- Check browser console for CSS errors
- Verify all files were uploaded correctly

## Support
For issues, check:
- Browser console for errors
- Server error logs
- Network tab for failed requests

