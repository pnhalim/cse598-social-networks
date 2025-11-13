# Database Migration Guide: Adding Survey Feature

This guide explains how to safely deploy the survey feature to production without breaking existing deployments.

## Overview

The migration adds:
1. `survey_completed` column to the `users` table
2. `survey_responses` table for storing survey data

## Migration Script

The migration script (`migrate_add_survey.py`) is **idempotent** - it's safe to run multiple times. It will:
- Check if columns/tables exist before creating them
- Set `survey_completed = False` for all existing users (so they'll see the survey)
- Handle both SQLite (local) and PostgreSQL (production) databases

## Deployment Options

### Option 1: Automatic Migration on Startup (Recommended)

The migration runs automatically when the app starts. This is already configured in `core/app.py`. 

**Pros:**
- No manual steps required
- Runs on every deployment automatically
- Safe because it's idempotent

**Cons:**
- Slight delay on first startup after deployment
- Migration errors won't crash the app (logged as warnings)

### Option 2: Manual Migration Before Deployment

Run the migration manually before deploying:

```bash
cd backend
python3 migrate_add_survey.py
```

**Pros:**
- You can verify it works before deployment
- Can catch errors early

**Cons:**
- Requires manual step
- Easy to forget

### Option 3: Run Migration After Deployment

If automatic migration doesn't work, you can run it manually after deployment:

1. SSH into your server (if applicable)
2. Or use a database management tool
3. Run: `python3 migrate_add_survey.py`

## For Neon PostgreSQL (Production)

The migration script automatically detects PostgreSQL and uses the correct syntax. When deploying to Vercel with Neon:

1. **Automatic**: The migration runs on app startup (already configured)
2. **Manual**: If needed, you can run it via Vercel's CLI or a one-time script

### Running Manually on Vercel

If you need to run the migration manually on Vercel:

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Run the migration script
vercel env pull  # Get environment variables
python3 migrate_add_survey.py
```

## Existing Users

All existing users will automatically have `survey_completed = False` set, which means:
- They will be redirected to `/survey` when they log in
- They must complete the survey before setting preferences
- They cannot see the user list until the survey is completed

This is handled automatically by the migration script.

## Verification

After deployment, verify the migration worked:

1. Check logs for "✅ Survey migration completed successfully"
2. Test with an existing user account - they should see the survey
3. Check database directly:
   ```sql
   -- PostgreSQL
   SELECT column_name FROM information_schema.columns 
   WHERE table_name='users' AND column_name='survey_completed';
   
   -- Should return: survey_completed
   ```

## Rollback (if needed)

If you need to rollback (not recommended after users start filling surveys):

```sql
-- PostgreSQL
ALTER TABLE users DROP COLUMN IF EXISTS survey_completed;
DROP TABLE IF EXISTS survey_responses;
```

**Warning**: This will delete all survey responses!

## Troubleshooting

### Migration fails on startup
- Check database connection
- Check logs for specific error
- Run migration manually to see detailed error

### Existing users not seeing survey
- Verify `survey_completed` column exists
- Check that existing users have `survey_completed = False`
- Run: `UPDATE users SET survey_completed = FALSE WHERE survey_completed IS NULL;`

### Column already exists error
- This is normal if migration ran before
- The script handles this gracefully
- No action needed

