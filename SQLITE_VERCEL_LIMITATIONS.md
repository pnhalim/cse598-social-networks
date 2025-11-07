# Why SQLite Doesn't Work on Vercel (And Alternatives)

## The Problem: Serverless Architecture

Vercel uses **serverless functions** - each API request is handled by a separate, isolated function instance. This creates several issues for SQLite:

### 1. **Read-Only Filesystem**

Vercel's serverless functions run on a **read-only filesystem** (except `/tmp`):
- You cannot write to the project directory
- SQLite needs to create/update `.db` files
- Even if you could write, the files would be lost when the function stops

### 2. **Stateless Functions**

Each function invocation is **completely independent**:
- No shared state between requests
- Each request might run on a different server
- Database file created in one function won't exist in the next

### 3. **Ephemeral Storage**

The only writable location is `/tmp`, but:
- `/tmp` is **ephemeral** - deleted when function ends
- Data is lost between function invocations
- Multiple concurrent requests can't reliably share the same file

### 4. **Concurrency Issues**

Even if you used `/tmp`:
- Multiple function instances would try to write to the same file
- SQLite doesn't handle concurrent writes from different processes well
- Would cause database corruption or locking errors

## Visual Example

```
Request 1 → Function Instance A → Tries to write to /tmp/db.db
Request 2 → Function Instance B → Tries to write to /tmp/db.db (different server!)
Request 3 → Function Instance C → Tries to write to /tmp/db.db (yet another server!)

Result: Database corruption, lost data, or locking errors
```

## Could You Make It Work? (Not Recommended)

### Option 1: Use `/tmp` with Limitations

You *could* modify the code to use `/tmp`:

```python
# In database.py
import tempfile
db_path = os.path.join(tempfile.gettempdir(), 'study_buddy.db')
SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_path}"
```

**Problems:**
- ❌ Data lost on every function restart
- ❌ No persistence between deployments
- ❌ Can't share data between function instances
- ❌ Database recreated on every cold start
- ❌ Not suitable for production

### Option 2: External File Storage

You could store the SQLite file in:
- AWS S3 / Google Cloud Storage
- Download on function start, upload on function end

**Problems:**
- ❌ Very slow (download/upload on every request)
- ❌ Complex implementation
- ❌ Still has concurrency issues
- ❌ Expensive (storage + transfer costs)
- ❌ Not practical for production

## The Solution: PostgreSQL

PostgreSQL works perfectly on Vercel because:

✅ **Network-based** - Connects via TCP/IP, not files
✅ **Shared database** - All function instances connect to the same database
✅ **Persistent** - Data survives function restarts and deployments
✅ **Concurrent** - Handles multiple simultaneous connections
✅ **Production-ready** - Designed for serverless architectures

## Vercel Postgres (Easiest Option)

Vercel offers built-in PostgreSQL:

1. **Free tier available** (Hobby plan)
2. **Automatically configured** - `DATABASE_URL` set automatically
3. **Same dashboard** - Manage everything in one place
4. **Optimized for Vercel** - Low latency, fast connections
5. **Easy migration** - Your SQLAlchemy code works as-is

### Setup is Simple:

1. Go to Vercel Dashboard → **Storage** → **Create Database** → **Postgres**
2. Choose Hobby plan (free)
3. `DATABASE_URL` is automatically set
4. Deploy - that's it!

## Alternative: External PostgreSQL

If you prefer external hosting:

- **Supabase** - Free tier, PostgreSQL
- **Neon** - Serverless PostgreSQL, free tier
- **Railway** - Easy PostgreSQL setup
- **Render** - Free PostgreSQL tier

All work the same way - just set `DATABASE_URL` in Vercel environment variables.

## Migration from SQLite to PostgreSQL

Your code is already compatible! The database configuration supports both:

```python
# Works with both SQLite and PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL.startswith("sqlite:///"):
    # SQLite (local development)
elif DATABASE_URL.startswith("postgresql://"):
    # PostgreSQL (production)
```

**Migration steps:**
1. Set up PostgreSQL (Vercel Postgres or external)
2. Set `DATABASE_URL` in Vercel environment variables
3. Tables are created automatically on first API call
4. (Optional) Export data from SQLite and import to PostgreSQL

## Summary

| Feature | SQLite on Vercel | PostgreSQL on Vercel |
|---------|------------------|----------------------|
| **Works?** | ❌ No (read-only filesystem) | ✅ Yes |
| **Persistent?** | ❌ No (ephemeral storage) | ✅ Yes |
| **Concurrent?** | ❌ No (file locking issues) | ✅ Yes |
| **Production-ready?** | ❌ No | ✅ Yes |
| **Setup complexity** | ⚠️ Complex workarounds | ✅ Simple |
| **Cost** | Free (but doesn't work) | Free tier available |

## Recommendation

**Use PostgreSQL for Vercel deployment:**
- ✅ Works perfectly with serverless
- ✅ Free tier available (Vercel Postgres Hobby plan)
- ✅ Your code already supports it
- ✅ Production-ready and scalable

**Keep SQLite for local development:**
- ✅ Fast and simple for development
- ✅ No setup required
- ✅ Perfect for testing

This is the standard approach: SQLite locally, PostgreSQL in production.

