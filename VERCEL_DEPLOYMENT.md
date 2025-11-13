# Vercel Deployment Troubleshooting

## Error: "cd frontend && npm install" exited with 1

This error typically occurs when Vercel can't find or access the frontend directory, or there's an issue with npm install.

### Solution 1: Configure Vercel Project Settings

In your Vercel dashboard:

1. Go to your project **Settings** → **General**
2. Set the **Root Directory** to `frontend`
3. Vercel will automatically detect it's a Vite project

### Solution 2: Update Build Settings

In Vercel dashboard → **Settings** → **Build & Development Settings**:

- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build` (or leave empty for auto-detection)
- **Output Directory**: `dist`
- **Install Command**: `npm install` (or leave empty for auto-detection)

### Solution 3: Check Node Version

Add a `.nvmrc` file in the frontend directory:

```bash
# frontend/.nvmrc
18
```

Or specify in `package.json`:

```json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### Solution 4: Verify package.json

Make sure `frontend/package.json` exists and is valid JSON. You can test locally:

```bash
cd frontend
npm install
npm run build
```

### Solution 5: Check for package-lock.json

If you have a `package-lock.json`, make sure it's committed to git. If not, you can generate one:

```bash
cd frontend
npm install --package-lock-only
git add package-lock.json
git commit -m "Add package-lock.json"
```

### Solution 6: Clear Vercel Build Cache

In Vercel dashboard:
1. Go to **Settings** → **General**
2. Scroll to **Danger Zone**
3. Click **Clear Build Cache**
4. Redeploy

### Solution 7: Check Vercel Logs

Look at the full build logs in Vercel to see the exact error. The error message will tell you:
- If `package.json` is missing
- If there's a dependency conflict
- If Node version is incompatible
- If there's a network issue downloading packages

### Common Issues:

1. **Missing package-lock.json**: Vercel prefers having a lock file for reproducible builds
2. **Node version mismatch**: Make sure Vercel is using Node 18+ (check in Settings → General)
3. **Dependency conflicts**: Some packages might not be compatible
4. **Network issues**: Sometimes npm registry is slow or blocked

### Quick Fix:

Try adding this to `frontend/package.json`:

```json
{
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

And ensure your Vercel project has:
- **Root Directory**: `frontend`
- **Framework Preset**: Vite (or auto-detect)

