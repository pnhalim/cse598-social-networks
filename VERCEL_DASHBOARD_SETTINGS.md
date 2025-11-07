# Vercel Dashboard Settings Guide

## ⚠️ Important: SQLite Limitation

**SQLite will NOT work on Vercel's serverless platform** because:
- Vercel uses a read-only filesystem (except `/tmp` which is ephemeral)
- SQLite requires write access to create/update database files
- Each serverless function invocation is stateless

**You MUST use PostgreSQL for Vercel deployment.** Options:
1. **Vercel Postgres** (recommended) - Built-in, automatically configured
2. **External PostgreSQL** - Supabase, Neon, Railway, etc.

## Build & Deployment Settings

### Settings → General

Most settings should be **auto-detected** from `vercel.json`, but verify:

1. **Framework Preset**
   - Should be: `Other` or auto-detected
   - No action needed if auto-detected

2. **Root Directory**
   - Leave **empty** (project root)
   - Don't set to `frontend/` or `backend/`

3. **Build Command**
   - Should be auto-detected from `vercel.json`
   - If not, set to: `cd frontend && npm install && npm run build`
   - **Note**: Backend build is handled automatically by `@vercel/python`

4. **Output Directory**
   - Should be auto-detected: `frontend/dist`
   - If not, set manually to: `frontend/dist`

5. **Install Command**
   - Should be auto-detected: `cd frontend && npm install`
   - If not, set manually

6. **Node.js Version**
   - Default: `18.x` (recommended)
   - Can specify in `frontend/.nvmrc` if needed

7. **Python Version**
   - Default: `3.9` (auto-detected)
   - Can specify in `api/.python-version` if needed

### Settings → Environment Variables

**Required Variables:**

1. **`DATABASE_URL`** (if not using Neon Postgres)
   - PostgreSQL connection string
   - Format: `postgresql://user:password@host:port/database`
   - **Important**: Cannot use SQLite on Vercel!

2. **`SECRET_KEY`**
   - JWT token signing key
   - Generate: `python -c "import secrets; print(secrets.token_urlsafe(32))"`

3. **Email Configuration:**
   - `MAIL_USERNAME`
   - `MAIL_PASSWORD`
   - `MAIL_FROM`
   - `MAIL_PORT`
   - `MAIL_SERVER`
   - `MAIL_FROM_NAME`

4. **Cloudinary Configuration:**
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

5. **Optional:**
   - `CORS_ORIGINS` - Comma-separated allowed origins
   - `VITE_API_BASE_URL` - Usually not needed (uses relative `/api`)

**Environment Scope:**
- Set each variable for: **Production**, **Preview**, and **Development**
- Or use different values per environment as needed

### Settings → Functions

The `vercel.json` already configures:
- **Max Duration**: 30 seconds (for API functions)
- This is set in `vercel.json`, no dashboard changes needed

### Storage (Database)

**If using Neon Postgres (Vercel's integrated provider):**

1. Go to **Storage** tab
2. Click **Create Database**
3. Select **Neon** (Vercel's integrated Postgres provider)
4. Follow the prompts to create your database
5. `DATABASE_URL` will be automatically set as an environment variable
6. No manual configuration needed!

**If Neon doesn't appear:**
- Install the Neon integration from the [Vercel Marketplace](https://vercel.com/marketplace)
- Or check your account settings for available integrations

## Recommended Settings Summary

### Auto-Detected (No Changes Needed)
- ✅ Framework Preset
- ✅ Build Command (from `vercel.json`)
- ✅ Output Directory (from `vercel.json`)
- ✅ Install Command (from `vercel.json`)
- ✅ Function Configuration (from `vercel.json`)

### Manual Configuration Required
- ⚙️ **Environment Variables** - Must set all required variables
- ⚙️ **Database** - Must set up PostgreSQL (Vercel Postgres or external)

### Optional Settings
- 🔧 **Node.js Version** - Only if you need a specific version
- 🔧 **Python Version** - Only if you need a specific version
- 🔧 **Custom Domain** - For production use

## Quick Checklist

Before deploying, ensure:

- [ ] All environment variables are set in Vercel dashboard
- [ ] PostgreSQL database is configured (Neon Postgres or external)
- [ ] `DATABASE_URL` is set (not SQLite!)
- [ ] `SECRET_KEY` is set with a secure random value
- [ ] Email credentials are configured
- [ ] Cloudinary credentials are configured (if using image uploads)
- [ ] Root Directory is empty (project root)
- [ ] Build settings are auto-detected correctly

## Troubleshooting

### Build Fails

1. **Check Build Logs** in Vercel dashboard
2. **Verify Node.js version** - May need `.nvmrc` file
3. **Check Python dependencies** - Ensure `api/requirements.txt` is correct
4. **Verify file paths** - Make sure `vercel.json` paths are correct

### API Returns 500 Errors

1. **Check Function Logs** in Vercel dashboard
2. **Verify `DATABASE_URL`** - Must be PostgreSQL, not SQLite
3. **Check environment variables** - All required vars must be set
4. **Verify database connection** - Test PostgreSQL connection
5. **If using Neon** - Check that Neon integration is properly connected

### Frontend Works but API Doesn't

1. **Check routing** - Verify `/api/*` routes to `api/index.py`
2. **Check function logs** - Look for Python errors
3. **Verify `api/index.py` exists** and is correct
4. **Check `api/requirements.txt`** - All dependencies listed

## Next Steps

1. Set up Vercel Postgres (or external PostgreSQL)
2. Configure all environment variables
3. Deploy and test
4. Check function logs for any errors
5. Verify database tables are created (on first API call)

