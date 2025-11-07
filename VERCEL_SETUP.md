# Vercel Deployment Guide for Study Buddy

This guide explains how to deploy the Study Buddy application to Vercel with both frontend and backend on the same instance.

## ✅ Full-Stack Deployment on Vercel

**Both frontend and backend are deployed on the same Vercel instance:**
- **Frontend**: React/Vite app served as static files
- **Backend**: FastAPI application running as serverless functions
- **Database**: PostgreSQL (Vercel Postgres recommended)

## 🗄️ Database Setup

**Important**: SQLite won't work on Vercel's serverless platform. You need to use PostgreSQL.

### Option 1: Vercel Postgres (Recommended)

1. In your Vercel project dashboard, go to **Storage** → **Create Database**
2. Select **Postgres**
3. Create a new database
4. The `DATABASE_URL` environment variable will be automatically set

### Option 2: External PostgreSQL

Use any PostgreSQL provider (Supabase, Neon, Railway, etc.) and set the `DATABASE_URL` environment variable.

## Deployment Steps

### Step 1: Install Vercel CLI (Optional but Recommended)

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Set Up Database

**If using Vercel Postgres:**
1. In Vercel dashboard, go to **Storage** → **Create Database** → **Postgres**
2. Create database (the `DATABASE_URL` will be auto-configured)

**If using external PostgreSQL:**
- Set `DATABASE_URL` environment variable (see Step 4)

### Step 4: Configure Environment Variables

**For Local Development:**
- Copy `.env.example` to `.env` and fill in your values
- See `ENV_SETUP.md` for detailed instructions

**For Vercel Deployment:**
In the Vercel dashboard (or via CLI), set the following environment variables:

#### Required Environment Variables:

1. **`DATABASE_URL`** (if not using Vercel Postgres)
   - **Value**: Your PostgreSQL connection string
   - **Format**: `postgresql://user:password@host:port/database`
   - **Note**: If using Vercel Postgres, this is set automatically

2. **`SECRET_KEY`**
   - **Value**: A secure random string for JWT token signing
   - **Generate**: `python -c "import secrets; print(secrets.token_urlsafe(32))"`

3. **Email Configuration** (for email verification):
   - `MAIL_USERNAME`: Your email address
   - `MAIL_PASSWORD`: Your email app password (for Gmail, use App Password)
   - `MAIL_FROM`: Your email address
   - `MAIL_PORT`: `587` (for Gmail)
   - `MAIL_SERVER`: `smtp.gmail.com` (or your SMTP server)
   - `MAIL_FROM_NAME`: `Study Buddy`

4. **Cloudinary Configuration** (for image uploads):
   - `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
   - `CLOUDINARY_API_KEY`: Your Cloudinary API key
   - `CLOUDINARY_API_SECRET`: Your Cloudinary API secret

5. **`CORS_ORIGINS`** (Optional)
   - **Value**: Comma-separated list of allowed origins
   - **Example**: `https://your-app.vercel.app,https://www.your-app.com`
   - **Default**: `*` (allows all origins)

#### How to Set Environment Variables:

**Via Vercel Dashboard:**
1. Go to your project on [vercel.com](https://vercel.com)
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable
4. Select environments: **Production**, **Preview**, and **Development**
5. Click **Save**

**Via Vercel CLI:**
```bash
vercel env add DATABASE_URL
vercel env add SECRET_KEY
# ... add other variables
```

### Step 5: Deploy

From the project root:

```bash
vercel
```

Or connect your GitHub repository through the Vercel dashboard and push to trigger automatic deployments.

### Step 6: Initialize Database Tables

After first deployment, the database tables will be created automatically when the API is first accessed (via `Base.metadata.create_all()` in `core/app.py`).

Alternatively, you can create a one-time migration script or use Vercel's CLI to run initialization:

```bash
vercel env pull .env.local
# Then run locally to initialize tables
```

### Step 7: Verify Deployment

1. **Frontend**: Visit your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
2. **Backend API**: Visit `https://your-app.vercel.app/api/docs` for Swagger documentation
3. **Health Check**: Visit `https://your-app.vercel.app/api/health`

## Local Development

Use the startup scripts provided:

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

**Windows:**
```bash
start.bat
```

These scripts will:
- Set up and start the backend server (http://localhost:8000)
- Set up and start the frontend server (http://localhost:5173)
- Handle dependencies and environment setup

## Project Structure for Vercel

```
study-buddy-598/
├── api/               # Vercel serverless function entry point
│   ├── index.py       # FastAPI handler for Vercel
│   └── requirements.txt
├── frontend/          # Vite/React app
│   ├── dist/          # Build output (generated)
│   ├── src/
│   └── package.json
├── backend/           # FastAPI app source code
│   ├── core/
│   ├── api/
│   └── requirements.txt
├── vercel.json        # Vercel configuration
├── start.sh           # Local development script (Linux/Mac)
└── start.bat          # Local development script (Windows)
```

## Troubleshooting

### Build Fails

1. **Check Node.js version**: Vercel uses Node.js 18.x by default
   - Add `.nvmrc` file in `frontend/` directory with your Node version if needed

2. **Check build logs**: Review the build output in Vercel dashboard
   - Look for Python dependency installation errors
   - Check if all requirements are installing correctly

3. **Python version**: Vercel uses Python 3.9 by default
   - If you need a different version, specify in `vercel.json` or use a `.python-version` file

### API Requests Fail

1. **404 errors on `/api/*` routes**:
   - Verify `vercel.json` has correct routing configuration
   - Check that `api/index.py` exists and is properly configured

2. **CORS errors**: 
   - Set `CORS_ORIGINS` environment variable with your Vercel domain
   - Format: `https://your-app.vercel.app,https://www.your-app.com`

3. **500 errors**:
   - Check Vercel function logs in the dashboard
   - Verify all environment variables are set
   - Check database connection string format

### Database Issues

1. **Connection errors**:
   - Verify `DATABASE_URL` is set correctly
   - For Vercel Postgres, ensure the database is created and active
   - Check that the connection string uses `postgresql://` (not `postgres://`)

2. **Table creation fails**:
   - Tables are created automatically on first API call
   - Check function logs for SQL errors
   - Ensure database user has CREATE TABLE permissions

3. **Migration from SQLite to PostgreSQL**:
   - Export data from SQLite: `sqlite3 study_buddy.db .dump > backup.sql`
   - Convert and import to PostgreSQL (may require manual conversion)
   - Or use a migration tool like `pgloader`

### Function Timeout

- Default timeout is 10 seconds, increased to 30 seconds in `vercel.json`
- For longer operations, consider:
  - Using Vercel's Background Functions
  - Breaking long operations into smaller chunks
  - Using a queue system (like Vercel Queue)

## Next Steps

1. ✅ Set up Vercel Postgres database (or external PostgreSQL)
2. ✅ Configure all environment variables
3. ✅ Deploy to Vercel
4. ✅ Verify database tables are created
5. ✅ Test the full application
6. ✅ Set up custom domain (optional)

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)

