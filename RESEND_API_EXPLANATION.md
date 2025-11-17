# Why Resend API Can't Be Called Directly from Static Sites

## The Problem

**Resend API blocks direct browser calls** due to CORS (Cross-Origin Resource Sharing) restrictions. This is a **security feature**, not a limitation of static sites.

## Why CORS Blocks It

1. **API Key Security**: If we could call Resend directly from the browser, the API key would be exposed in the JavaScript code, visible to anyone who inspects the page source
2. **Rate Limiting**: Resend needs to control who can send emails to prevent abuse
3. **Standard Practice**: Most APIs (including Resend) don't allow direct browser calls for security reasons

## Current Implementation

The code now:
1. ✅ Generates Nostr keys **client-side** (secure - keys are generated in the browser)
2. ✅ Tries to use the **server-side API route** first (if available)
3. ✅ Falls back to direct Resend call (will fail with CORS, but shows helpful error)
4. ✅ Shows a clear error message explaining the CORS limitation

## Solutions for Static Hosting

### Option 1: Use Hostinger's Node.js Hosting (If Available)
- Deploy the `/api/signup` endpoint
- API key stays secure on the server
- ✅ **Best option if available**

### Option 2: Serverless Function (Recommended for Static)
Deploy a serverless function to Vercel/Netlify/Cloudflare:
- Free tier available
- Handles the Resend API call server-side
- Update `SignUp.svelte` to call the serverless function URL
- ✅ **Works with static hosting**

### Option 3: Alternative Email Service
Use a service that supports CORS (rare):
- Most email APIs block browser calls for security
- Would require finding and integrating a different service

### Option 4: Remove Email Signup
- Only use "Log in with keys" option
- Users generate keys elsewhere
- ✅ **Simplest for pure static hosting**

## Recommendation

For **Hostinger static hosting**, I recommend:
1. **Short-term**: Remove or disable email signup, use "Log in with keys" only
2. **Long-term**: Deploy a serverless function (Vercel/Netlify) to handle email sending

The code is ready - it will work once you have a server-side endpoint (either Node.js hosting or serverless function).

