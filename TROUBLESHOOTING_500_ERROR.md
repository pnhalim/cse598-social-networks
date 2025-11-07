# Troubleshooting 500 Error on Vercel

## Common Causes

### 1. Missing DATABASE_URL Environment Variable

**Error**: `DATABASE_URL environment variable is not set`

**Solution**:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add `DATABASE_URL` with your PostgreSQL connection string
3. Or set up Neon Postgres through Storage tab (DATABASE_URL will be auto-set)

**Important**: SQLite will NOT work on Vercel. You must use PostgreSQL.

### 2. Database Connection Failed

**Error**: Connection timeout or authentication failed

**Solution**:
- Verify `DATABASE_URL` is correct
- Check that the database is accessible from Vercel
- Ensure database credentials are correct
- For Neon Postgres, verify the integration is properly connected

### 3. Missing Environment Variables

**Error**: Module import fails or configuration errors

**Solution**: Ensure all required environment variables are set:
- `DATABASE_URL` (required)
- `SECRET_KEY` (required)
- `MAIL_USERNAME`, `MAIL_PASSWORD`, etc. (for email features)
- `CLOUDINARY_*` (for image uploads)

### 4. Import Path Issues

**Error**: ModuleNotFoundError or ImportError

**Solution**: The `api/index.py` should automatically handle this, but verify:
- `api/requirements.txt` includes all dependencies
- Backend code structure is correct

## How to Debug

### Check Vercel Function Logs

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the failed deployment
3. Go to **Functions** tab
4. Click on the function that's failing
5. Check the **Logs** tab for detailed error messages

### Test Database Connection

You can test if your database is accessible by checking the `/api/health` endpoint:
- Visit: `https://your-app.vercel.app/api/health`
- Should return: `{"status":"healthy","message":"Study Buddy API is running"}`

### Verify Environment Variables

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Verify all required variables are set
3. Make sure they're set for the correct environment (Production, Preview, Development)

## Quick Checklist

- [ ] `DATABASE_URL` is set (PostgreSQL, not SQLite)
- [ ] `SECRET_KEY` is set
- [ ] All email configuration variables are set (if using email features)
- [ ] Database is accessible and credentials are correct
- [ ] Checked Vercel function logs for specific error messages
- [ ] All dependencies are listed in `api/requirements.txt`

## Next Steps

After fixing the issue:
1. Commit and push your changes
2. Vercel will automatically redeploy
3. Check the new deployment logs
4. Test the API endpoint again

If you're still getting errors, check the Vercel function logs for the specific error message - that will tell you exactly what's wrong.

