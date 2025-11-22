# Hostinger Deployment Instructions

## Package Information
- **File:** `flotilla-deployment-YYYYMMDD-HHMMSS.zip`
- **Size:** ~2.1 MB
- **Contents:** 277 files (production build, source maps excluded)

## Deployment Steps

### 1. Upload to Hostinger
1. Log into your Hostinger control panel
2. Navigate to **File Manager** or use **FTP**
3. Go to your domain's `public_html` directory (or `htdocs` depending on your setup)

### 2. Extract Files
1. Upload the zip file to `public_html`
2. Extract the zip file in `public_html`
3. **Important:** Extract so that `index.html` is directly in `public_html`, not in a subdirectory

### 3. Verify Structure
After extraction, your `public_html` should contain:
- `index.html` (main entry point)
- `_app/` directory (application code)
- `manifest.webmanifest`
- `favicon.ico`
- `fonts/` directory
- `pwa-*.png` files
- Other static assets

### 4. Configure Server
Ensure your web server is configured to:
- Serve `index.html` for all routes (SPA routing)
- Support `.well-known/` directory for NIP-05 verification

### 5. Test Deployment
1. Visit your domain: `https://anmore.me`
2. Check browser console for any errors
3. Verify NIP-05 verification works (check badges appear for verified users)

## Important Notes

- **NIP-05 Verification:** Make sure `https://anmore.me/.well-known/nostr.json` is accessible
- **HTTPS Required:** The app requires HTTPS for NIP-05 verification to work
- **CORS:** If testing locally, CORS errors are expected. They won't occur in production.

## Troubleshooting

If you see 404 errors:
- Ensure your server is configured for SPA routing (all routes should serve `index.html`)
- Check that all files were extracted correctly

If verification badges don't appear:
- Verify `nostr.json` is accessible at `https://anmore.me/.well-known/nostr.json`
- Check browser console for errors
- Ensure the domain has valid SSL certificate

