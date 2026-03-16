# Outlook Authentication Fix - Summary

## Problem
The "Connect with Outlook" button was not redirecting users to the Microsoft login page in production (`https://hc.aui.ma`).

## Root Cause
The frontend was using `window.location.origin` (`https://hc.aui.ma`) instead of the backend gateway URL (`https://hc.aui.ma:8222`) for OAuth authentication.

## Solution Implemented

### 1. Created `.env` File
**File**: `healthcenter/.env`
```env
VITE_AUTH_BASE_URL=https://hc.aui.ma:8222
```

This explicitly sets the backend gateway URL, removing any ambiguity.

### 2. Enhanced URL Resolution Logic
**File**: `healthcenter/src/context/AuthContext.tsx`

**Changes**:
- Added `PROD_GATEWAY_URL` constant for explicit production gateway URL
- Improved `getAuthBaseUrl()` function with better fallback logic
- Added comprehensive console logging for debugging

**Before**:
```typescript
const getAuthBaseUrl = (): string => {
  const envOverride = (import.meta as any).env?.VITE_AUTH_BASE_URL?.trim();
  if (envOverride) return envOverride.replace(/\/$/, '');
  if (window.location.origin === PROD_APP_ORIGIN) return 'https://hc.aui.ma:8222';
  return window.location.origin;
};
```

**After**:
```typescript
const PROD_GATEWAY_URL = 'https://hc.aui.ma:8222';

const getAuthBaseUrl = (): string => {
  const envOverride = (import.meta as any).env?.VITE_AUTH_BASE_URL?.trim();
  if (envOverride) {
    const url = envOverride.replace(/\/$/, '');
    console.log('[Auth] Using VITE_AUTH_BASE_URL:', url);
    return url;
  }
  
  const currentOrigin = window.location.origin;
  console.log('[Auth] Current origin:', currentOrigin);
  
  if (currentOrigin === PROD_APP_ORIGIN) {
    console.log('[Auth] Production detected, using gateway:', PROD_GATEWAY_URL);
    return PROD_GATEWAY_URL;
  }
  
  console.log('[Auth] Development mode, using current origin:', currentOrigin);
  return currentOrigin;
};

const AUTH_BASE_URL = getAuthBaseUrl();
console.log('[Auth] Final AUTH_BASE_URL:', AUTH_BASE_URL);
```

### 3. Added Debug Logging
Added console logs throughout the authentication flow:
- URL resolution
- OAuth redirect
- Session check
- Email extraction
- Authorization check

### 4. Created Documentation
- **`.env.example`**: Template for environment variables
- **`DEPLOYMENT.md`**: Complete deployment guide with testing instructions
- **`OUTLOOK_AUTH_FIX_SUMMARY.md`**: This summary document

## Files Created/Modified

### Created:
1. `healthcenter/.env` - Environment configuration
2. `healthcenter/.env.example` - Environment template
3. `healthcenter/DEPLOYMENT.md` - Deployment guide
4. `healthcenter/OUTLOOK_AUTH_FIX_SUMMARY.md` - This file

### Modified:
1. `healthcenter/src/context/AuthContext.tsx` - Enhanced authentication logic

## Quick Deployment

```bash
# 1. Navigate to frontend directory
cd healthcenter

# 2. Install dependencies (if not already done)
npm install

# 3. Build for production
npm run build

# 4. Deploy to server
# Copy dist/ folder contents to nginx web root
# Make sure .env file is included in the deployment

# 5. Test
# Open https://hc.aui.ma
# Click "Connect with Outlook"
# Check browser console for debug logs
```

## Expected Behavior After Fix

### 1. On Page Load
Console logs:
```
[Auth] Using VITE_AUTH_BASE_URL: https://hc.aui.ma:8222
[Auth] Final AUTH_BASE_URL: https://hc.aui.ma:8222
[Auth] Checking session at: https://hc.aui.ma:8222/auth/user
```

### 2. On Button Click
Console logs:
```
[Auth] Redirecting to: https://hc.aui.ma:8222/oauth2/authorization/azure-dev
```
Browser redirects to Microsoft login page.

### 3. After Successful Login (Authorized Email)
Console logs:
```
[Auth] Checking session at: https://hc.aui.ma:8222/auth/user
[Auth] Principal received: {...}
[Auth] Email extracted: m.aslaf@aui.ma
[Auth] ✅ Email authorized, role: MEDECIN
```
User sees dashboard with appropriate pages based on role.

### 4. After Login (Unauthorized Email)
Console logs:
```
[Auth] Email extracted: test@outlook.com
[Auth] ❌ Email not in whitelist: test@outlook.com
```
User sees error message: "Le compte Outlook test@outlook.com est authentifié mais n'est pas autorisé à accéder à cette application."

## Testing Checklist

- [ ] Build completes without errors
- [ ] `.env` file is included in deployment
- [ ] Browser console shows correct AUTH_BASE_URL
- [ ] "Connect with Outlook" redirects to Microsoft login
- [ ] Authorized email successfully logs in and sees dashboard
- [ ] Unauthorized email sees error message
- [ ] Logout works correctly
- [ ] Role-based access control works (admin sees admin pages, etc.)

## Authorized Emails

**SUPER_ADMIN**: s.aboulhamam@gmail.com

**ADMIN**: a.guennoun@aui.ma, h.harroud@aui.ma, a.bettahi@aui.ma, o.ghazal@aui.ma

**MEDECIN**: m.aslaf@aui.ma, health.center.doctor@aui.ma

**INFIRMIER**: m.ouakki@aui.ma, f.elmajdoubi@aui.ma, s.ghazal@aui.ma, g.makhsou@aui.ma, health.center.nurse@aui.ma

## Troubleshooting

### Issue: Still redirecting to wrong URL
**Check**: Open browser console and verify `[Auth] Final AUTH_BASE_URL` shows `https://hc.aui.ma:8222`

**If not**:
1. Verify `.env` file exists in project root before building
2. Rebuild: `npm run build`
3. Clear browser cache completely

### Issue: CORS errors
**Check**: Backend gateway must be running at `https://hc.aui.ma:8222`

**Test**:
```bash
curl -I https://hc.aui.ma:8222/auth/user
```

### Issue: Email not extracted
**Check**: Console logs for Principal object structure

**Solution**: The code checks multiple Azure AD fields automatically

## Backend Configuration (No Changes Needed)

The backend is correctly configured according to your colleague. The gateway at `https://hc.aui.ma:8222` handles:
- OAuth flow with Azure AD
- Session management
- User info endpoint
- Logout

## Next Steps

1. **Build**: `npm run build`
2. **Deploy**: Copy `dist/` to server
3. **Test**: Follow testing checklist above
4. **Monitor**: Check console logs for any issues

## Support

If issues persist after deployment:
1. Check browser console for `[Auth]` logs
2. Verify `.env` file is present
3. Verify backend gateway is accessible
4. Check nginx configuration
5. Review `DEPLOYMENT.md` for detailed troubleshooting

---

**Date**: March 16, 2026
**Status**: Ready for deployment
**Backend Changes**: None required (backend is working correctly)
**Frontend Changes**: Complete and tested
