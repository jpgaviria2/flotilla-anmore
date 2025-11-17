# Client-Side Email Signup with Resend API

## The Issue

The Resend API **does not allow direct browser calls** due to CORS (Cross-Origin Resource Sharing) restrictions. This is a security feature to prevent API keys from being exposed in client-side code.

## Current Status

✅ **Code Updated**: The signup component now calls Resend API directly from the client
✅ **API Key Embedded**: The `VITE_RESEND_API_KEY` is included in the build
❌ **CORS Blocked**: Resend API blocks browser requests with CORS error

## Error Message
```
Access to fetch at 'https://api.resend.com/emails' from origin 'http://localhost:8080' 
has been blocked by CORS policy
```

## Solutions

### Option 1: Server-Side API Route (Recommended)
Keep the `/api/signup` endpoint and use Node.js hosting:
- **Pros**: Secure (API key stays on server), works reliably
- **Cons**: Requires Node.js hosting (not pure static)

### Option 2: Serverless Function
Use a serverless function (Vercel, Netlify, Cloudflare Workers):
- **Pros**: Works with static hosting, secure
- **Cons**: Requires additional setup

### Option 3: CORS Proxy (Not Recommended)
Use a CORS proxy service:
- **Pros**: Works immediately
- **Cons**: Security risk, unreliable, exposes API key

### Option 4: Alternative Email Service
Use an email service that supports CORS:
- **Pros**: Works client-side
- **Cons**: Need to find and integrate different service

## Recommendation

For production deployment on Hostinger (static hosting), you have two options:

1. **Use Hostinger's Node.js hosting** (if available) to run the `/api/signup` endpoint
2. **Use a serverless function** (Vercel, Netlify, etc.) as a proxy for the Resend API
3. **Remove email signup** and only use the "Log in with keys" option

## Current Implementation

The code is ready - it will work once deployed to a server that can make server-side API calls, or if Resend enables CORS for your domain (unlikely).

