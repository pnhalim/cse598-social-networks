# Environment Variables Setup

## Consolidated Environment File

All environment variables for both frontend and backend are now consolidated into a single `.env` file at the project root.

## Quick Start

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your values:**
   - Email credentials (for email verification)
   - Cloudinary credentials (for image uploads)
   - Secret key (for JWT tokens)
   - Database URL (for production, leave empty for local SQLite)

3. **That's it!** Both frontend and backend will automatically read from this file.

## Environment Variables Reference

### Database Configuration

- **`DATABASE_URL`** (Optional)
  
  **For SQLite (local development):**
  - **Option 1**: Leave empty (default) - Uses `backend/core/study_buddy.db`
  - **Option 2**: Set to SQLite URL format:
    - `sqlite:///backend/core/study_buddy.db` (relative path)
    - `sqlite:////absolute/path/to/database.db` (absolute path, note the 4 slashes)
    - `sqlite:///:memory:` (in-memory database, for testing)
  
  **For PostgreSQL (production/Vercel):**
  - Set to PostgreSQL connection string
  - Format: `postgresql://user:password@host:port/database`
  - Example: `postgresql://user:pass@localhost:5432/studybuddy`

### Security

- **`SECRET_KEY`** (Required)
  - JWT token signing key
  - Generate with: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
  - **Important**: Use a strong, random key in production!

### Email Configuration

Required for email verification and password reset:

- **`MAIL_USERNAME`**: Your email address
- **`MAIL_PASSWORD`**: Your email app password (for Gmail, use App Password)
- **`MAIL_FROM`**: Your email address
- **`MAIL_PORT`**: `587` (for Gmail)
- **`MAIL_SERVER`**: `smtp.gmail.com` (or your SMTP server)
- **`MAIL_FROM_NAME`**: Display name (e.g., "Study Buddy")

**Gmail Setup:**
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Go to App passwords
4. Generate an app password
5. Use this app password (not your regular password)

### Cloudinary Configuration

Required for image uploads (profile pictures):

- **`CLOUDINARY_CLOUD_NAME`**: Your Cloudinary cloud name
- **`CLOUDINARY_API_KEY`**: Your Cloudinary API key
- **`CLOUDINARY_API_SECRET`**: Your Cloudinary API secret

Sign up at [cloudinary.com](https://cloudinary.com) to get these values.

### Frontend Configuration

- **`VITE_API_BASE_URL`** (Optional - Usually not needed for Vercel)
  
  **For Local Development:**
  - Set to: `http://localhost:8000`
  - Or leave empty (defaults to `http://localhost:8000`)
  
  **For Vercel Production:**
  - **Leave empty or don't set** - The code automatically uses `/api` (relative URL)
  - OR set to `/api` explicitly (same result)
  - **Do NOT set to full URL** like `https://your-app.vercel.app/api` (not needed)
  
  **Why relative URL?**
  - Works on all Vercel domains (production, preview, custom domains)
  - No CORS issues (same origin)
  - Automatically uses correct protocol (http/https)
  - **Note**: Vite requires the `VITE_` prefix for environment variables

### CORS Configuration

- **`CORS_ORIGINS`** (Optional)
  - Comma-separated list of allowed origins
  - Example: `https://your-app.vercel.app,https://www.your-app.com`
  - Leave empty to allow all origins (not recommended for production)

## How It Works

### Backend
- Reads from `.env` file in project root (or `backend/.env` as fallback)
- Uses `pydantic-settings` to load environment variables
- Automatically checks both locations

### Frontend
- Vite automatically reads `.env` files from the project root
- Only variables with `VITE_` prefix are exposed to the frontend
- Other variables are server-side only

## File Locations

- **`.env.example`**: Template file (safe to commit to git)
- **`.env`**: Your actual environment variables (DO NOT commit to git)
- **`backend/env_example.txt`**: Legacy file (kept for reference)

## Production (Vercel)

For Vercel deployment, set environment variables in:
- **Vercel Dashboard** → **Settings** → **Environment Variables**

You don't need to upload a `.env` file to Vercel. All variables should be set in the dashboard.

## Troubleshooting

### Backend can't find environment variables

1. Make sure `.env` file exists in the project root
2. Check that variable names match exactly (case-sensitive)
3. Restart the backend server after changing `.env`

### Frontend can't access environment variables

1. Make sure variables start with `VITE_` prefix
2. Restart the Vite dev server after changing `.env`
3. Check browser console for errors

### Variables not loading

1. Ensure no extra spaces around `=` sign
2. Don't use quotes unless necessary
3. For values with spaces, use quotes: `MAIL_FROM_NAME="Study Buddy"`

