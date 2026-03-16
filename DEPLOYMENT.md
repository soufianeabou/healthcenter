# Deployment Guide - AUI Health Center Frontend

## Overview
This guide explains how to deploy the frontend to the production server with the Outlook authentication fix.

## Changes Made

### 1. Environment Configuration
- **Created**: `.env` file with `VITE_AUTH_BASE_URL=https://hc.aui.ma:8222`
- **Created**: `.env.example` for documentation

### 2. Authentication Context Improvements
- **Enhanced URL resolution logic** with explicit production gateway URL
- **Added comprehensive logging** for debugging authentication flow
- **Improved error handling** and visibility

### 3. Debug Logging Added
The following console logs will help diagnose issues:
- `[Auth] Using VITE_AUTH_BASE_URL: ...` - Shows environment variable value
- `[Auth] Current origin: ...` - Shows detected origin
- `[Auth] Production detected, using gateway: ...` - Confirms production mode
- `[Auth] Final AUTH_BASE_URL: ...` - Shows final URL being used
- `[Auth] Redirecting to: ...` - Shows OAuth redirect URL
- `[Auth] Checking session at: ...` - Shows session check URL
- `[Auth] Email extracted: ...` - Shows extracted email from OAuth
- `[Auth] ✅ Email authorized, role: ...` - Confirms successful authorization
- `[Auth] ❌ Email not in whitelist: ...` - Shows unauthorized email attempts

## Deployment Steps

### Step 1: Build the Frontend
```bash
cd healthcenter
npm install
npm run build
```

This will create a `dist/` folder with the production build.

### Step 2: Copy `.env` File
**IMPORTANT**: Make sure to copy the `.env` file to the server along with the built files.

```bash
# The .env file should be in the same directory as your built files
# or in the root where nginx serves from
cp .env dist/.env
```

### Step 3: Deploy to Server
Copy the `dist/` folder contents to your nginx web root (typically `/var/www/html` or similar).

```bash
# Example (adjust paths as needed)
scp -r dist/* user@hc.aui.ma:/var/www/html/
scp .env user@hc.aui.ma:/var/www/html/.env
```

### Step 4: Nginx Configuration
Ensure your nginx configuration is set up correctly. It should look something like this:

```nginx
server {
    listen 443 ssl;
    server_name hc.aui.ma;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    root /var/www/html;
    index index.html;
    
    # Serve the frontend
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy API requests to backend
    location /api/ {
        proxy_pass https://192.168.1.97:8282;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Step 5: Restart Nginx
```bash
sudo systemctl restart nginx
# or
sudo nginx -s reload
```

## Testing the Deployment

### 1. Clear Browser Cache
Before testing, clear your browser cache and localStorage:
- Open DevTools (F12)
- Go to Application tab
- Click "Clear storage"
- Reload the page

### 2. Open Browser Console
Keep the browser console open to see debug logs.

### 3. Test Authentication Flow

#### Test 1: Authorized User
1. Navigate to `https://hc.aui.ma`
2. Click "Se connecter avec Outlook"
3. **Expected console logs**:
   ```
   [Auth] Final AUTH_BASE_URL: https://hc.aui.ma:8222
   [Auth] Redirecting to: https://hc.aui.ma:8222/oauth2/authorization/azure-dev
   ```
4. You should be redirected to Microsoft login page
5. Login with an authorized email (e.g., `m.aslaf@aui.ma`)
6. **Expected console logs after redirect**:
   ```
   [Auth] Checking session at: https://hc.aui.ma:8222/auth/user
   [Auth] Principal received: {...}
   [Auth] Email extracted: m.aslaf@aui.ma
   [Auth] ✅ Email authorized, role: MEDECIN
   ```
7. You should see the dashboard

#### Test 2: Unauthorized User
1. Logout and clear storage
2. Click "Se connecter avec Outlook"
3. Login with an unauthorized email (e.g., `test@outlook.com`)
4. **Expected console logs**:
   ```
   [Auth] Email extracted: test@outlook.com
   [Auth] ❌ Email not in whitelist: test@outlook.com
   ```
5. You should see error message: "Le compte Outlook test@outlook.com est authentifié mais n'est pas autorisé à accéder à cette application."

## Authorized Email List

The following emails are authorized (case-insensitive):

**SUPER_ADMIN**:
- s.aboulhamam@gmail.com

**ADMIN**:
- a.guennoun@aui.ma
- h.harroud@aui.ma
- a.bettahi@aui.ma
- o.ghazal@aui.ma

**MEDECIN**:
- m.aslaf@aui.ma
- health.center.doctor@aui.ma

**INFIRMIER**:
- m.ouakki@aui.ma
- f.elmajdoubi@aui.ma
- s.ghazal@aui.ma
- g.makhsou@aui.ma
- health.center.nurse@aui.ma

## Troubleshooting

### Issue: "Connect with Outlook" button does nothing
**Solution**: Check console logs. If you see `[Auth] Redirecting to: https://hc.aui.ma/oauth2/...` (without port 8222), the `.env` file is not being loaded.

**Fix**:
1. Ensure `.env` file exists in the project root before building
2. Rebuild: `npm run build`
3. Verify the build includes the environment variable

### Issue: CORS errors
**Solution**: The backend gateway at `https://hc.aui.ma:8222` must be running and accessible.

**Check**:
```bash
curl -I https://hc.aui.ma:8222/auth/user
```

### Issue: Redirects to wrong URL after login
**Solution**: Check the backend `SecurityConfig.java` - the `authenticationSuccessHandler` should redirect to `https://hc.aui.ma/`.

### Issue: Email not extracted from Principal
**Solution**: Check console logs for the Principal object structure. The code checks multiple fields:
- `attributes.email`
- `attributes.preferred_username`
- `attributes.upn`
- `attributes.userPrincipalName`
- `name`

## Backend Requirements

Ensure the backend gateway is running and configured:
- **URL**: `https://hc.aui.ma:8222`
- **OAuth endpoint**: `/oauth2/authorization/azure-dev`
- **User endpoint**: `/auth/user`
- **Logout endpoint**: `/logout`
- **CORS**: Must allow origin `https://hc.aui.ma`

## Files Modified

1. **Created**: `healthcenter/.env`
2. **Created**: `healthcenter/.env.example`
3. **Modified**: `healthcenter/src/context/AuthContext.tsx`
4. **Created**: `healthcenter/DEPLOYMENT.md` (this file)

## Support

If authentication still doesn't work after following these steps:
1. Check browser console for error messages
2. Check nginx error logs: `sudo tail -f /var/log/nginx/error.log`
3. Check backend gateway logs
4. Verify the backend gateway is accessible from the server
5. Verify SSL certificates are valid

## Security Notes

- The `.env` file contains the gateway URL which is not sensitive (it's public)
- The `.env` file is in `.gitignore` to follow best practices
- Session cookies are HTTP-only and secure
- OAuth tokens are never stored in localStorage
- Only email addresses are stored locally (no passwords or tokens)
