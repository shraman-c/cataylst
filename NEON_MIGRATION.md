# Migrating Catalyst from Supabase to Neon (Netlify Postgres)

This guide walks you through migrating your Catalyst backend from Supabase to Neon, Netlify's serverless Postgres database.

---

## Why Neon?

- **Serverless Postgres:** Auto-scales with your application
- **Netlify Integration:** Seamless deployment with Netlify
- **PostgreSQL Compatible:** Uses standard Postgres drivers
- **Cost-Effective:** Pay only for what you use
- **Branching:** Database branches for development/preview

---

## Migration Steps

### 1. Create a Neon Database

1. **Sign up for Neon:**
   - Go to https://neon.tech or use Netlify's Neon integration
   - Sign up or log in to your account

2. **Create a new project:**
   - Click "New Project"
   - Choose a name (e.g., "catalyst-db")
   - Select a region (choose closest to your users)
   - Note: Neon automatically creates a default database named `neondb`

3. **Get your connection string:**
   - Navigate to your project dashboard
   - Find the "Connection Details" section
   - Copy the **Pooled connection string** (recommended for serverless)
   - Format: `postgresql://[user]:[password]@[host]/[dbname]?sslmode=require`

### 2. Export Data from Supabase

#### Option A: Export via Supabase Dashboard (Recommended for small datasets)

1. Go to your Supabase project dashboard
2. Navigate to **Table Editor**
3. For each table, click the **Export** button and download as CSV
4. Tables to export:
   - students
   - teachers
   - courses
   - rooms
   - programs
   - timetables
   - change_requests

#### Option B: Export via pg_dump (Recommended for production)

```bash
# Install pg_dump if not already installed
# Windows: Download from https://www.postgresql.org/download/windows/
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql-client

# Get your Supabase connection string from Project Settings > Database
# Format: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# Export schema only
pg_dump "postgresql://postgres:[YOUR_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" \
  --schema-only \
  --no-owner \
  --no-privileges \
  > supabase_schema.sql

# Export data only (excluding auth and storage tables)
pg_dump "postgresql://postgres:[YOUR_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" \
  --data-only \
  --no-owner \
  --no-privileges \
  --table=students \
  --table=teachers \
  --table=courses \
  --table=rooms \
  --table=programs \
  --table=timetables \
  --table=change_requests \
  > supabase_data.sql
```

### 3. Import Schema and Data to Neon

#### Using Neon SQL Editor (Web Interface)

1. Log into Neon Console
2. Navigate to your project
3. Go to **SQL Editor**
4. Run the schema file first:
   - Copy contents of `create-database-schema.sql` from your project
   - Paste and execute in SQL Editor
5. Import data:
   - Use the CSV import feature or run SQL INSERT statements

#### Using psql CLI (Recommended for large datasets)

```bash
# Install psql if not already installed
# Connection string from Neon dashboard (use pooled connection)

# Import schema
psql "postgresql://[user]:[password]@[host]/neondb?sslmode=require" \
  < create-database-schema.sql

# Import data (if using pg_dump export)
psql "postgresql://[user]:[password]@[host]/neondb?sslmode=require" \
  < supabase_data.sql
```

### 4. Update Application Configuration

#### Install Postgres Client

```bash
npm install pg
# or
npm install @neondatabase/serverless
```

The `@neondatabase/serverless` package is optimized for serverless environments and works with Netlify Edge Functions.

#### Update Environment Variables

Update your `.env` file:

```env
# Neon Database Configuration
DATABASE_URL=postgresql://[user]:[password]@[host]/neondb?sslmode=require

# Legacy Supabase variables (can be removed after migration)
# SUPABASE_URL=...
# SUPABASE_ANON_KEY=...
# SUPABASE_SERVICE_ROLE_KEY=...

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:9002

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
```

#### Update Database Client Code

Create a new file `src/server/neon.ts`:

```typescript
import { neon, neonConfig } from '@neondatabase/serverless';

// Enable connection pooling for better performance
neonConfig.fetchConnectionCache = true;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in the environment');
}

// Create a SQL query function
const sql = neon(DATABASE_URL);

/**
 * Execute a SQL query
 */
export async function query(text: string, params?: any[]) {
  try {
    const result = await sql(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Get all records from a table
 */
export async function getAll(tableName: string) {
  return query(`SELECT * FROM ${tableName}`);
}

/**
 * Get record by ID
 */
export async function getById(tableName: string, id: string) {
  const result = await query(
    `SELECT * FROM ${tableName} WHERE id = $1 OR custom_id = $1`,
    [id]
  );
  return result[0];
}

/**
 * Insert a record
 */
export async function insert(tableName: string, data: any) {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  
  const result = await query(
    `INSERT INTO ${tableName} (${keys.join(', ')}) 
     VALUES (${placeholders}) 
     RETURNING *`,
    values
  );
  return result[0];
}

/**
 * Update a record
 */
export async function update(tableName: string, id: string, data: any) {
  const entries = Object.entries(data);
  const setClause = entries.map(([key], i) => `${key} = $${i + 2}`).join(', ');
  const values = [id, ...entries.map(([, value]) => value)];
  
  const result = await query(
    `UPDATE ${tableName} 
     SET ${setClause}, updated_at = NOW() 
     WHERE id = $1 OR custom_id = $1 
     RETURNING *`,
    values
  );
  return result[0];
}

/**
 * Delete a record
 */
export async function deleteRecord(tableName: string, id: string) {
  const result = await query(
    `DELETE FROM ${tableName} WHERE id = $1 OR custom_id = $1 RETURNING *`,
    [id]
  );
  return result[0];
}

/**
 * Get connection for transaction or complex queries
 */
export { sql };
```

#### Update API Routes

Update your API routes to use the new Neon client. Example for `src/app/api/data/students/route.ts`:

```typescript
import { query, getAll, insert, update, deleteRecord } from '@/server/neon';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const students = await getAll('students');
    return NextResponse.json({ students });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const student = await insert('students', {
      ...data,
      custom_id: data.custom_id || crypto.randomUUID(),
      created_at: new Date(),
      updated_at: new Date(),
    });
    return NextResponse.json({ student }, { status: 201 });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    );
  }
}
```

### 5. Deploy to Netlify

#### Create `netlify.toml` configuration:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NODE_VERSION = "18"

# Netlify Functions configuration
[functions]
  node_bundler = "esbuild"

# Environment variables (set in Netlify UI or CLI)
# DATABASE_URL will be automatically injected by Netlify if using their Neon integration
```

#### Deploy via Netlify CLI:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize site
netlify init

# Set environment variables
netlify env:set DATABASE_URL "postgresql://[user]:[password]@[host]/neondb?sslmode=require"
netlify env:set NEXTAUTH_SECRET "your_secret"
netlify env:set NEXTAUTH_URL "https://your-site.netlify.app"
netlify env:set JWT_SECRET "your_jwt_secret"

# Deploy
netlify deploy --prod
```

#### Or deploy via Netlify Dashboard:

1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables in Site Settings > Environment Variables
5. Enable Netlify Neon integration (if available) or manually add DATABASE_URL

### 6. Verify Migration

After deployment, test your application:

1. **Test database connection:**
   - Visit your app's health endpoint (if you have one)
   - Or check Netlify Function logs for connection errors

2. **Test CRUD operations:**
   - Try logging in
   - View student/teacher data
   - Create a test timetable
   - Submit a change request

3. **Monitor logs:**
   ```bash
   netlify dev  # Local testing
   netlify logs # Production logs
   ```

### 7. Rollback Plan (If Needed)

If you encounter issues, you can quickly rollback:

1. Switch back to Supabase env vars in Netlify
2. Redeploy previous version
3. Keep both databases running during transition period

---

## Differences: Supabase vs Neon

| Feature | Supabase | Neon |
|---------|----------|------|
| **Database** | PostgreSQL + Auth/Storage | PostgreSQL only |
| **Auth** | Built-in | Use NextAuth.js (already implemented) |
| **Storage** | Built-in | Use separate service (S3, Cloudinary) |
| **Real-time** | Built-in subscriptions | Use separate solution (Pusher, Socket.io) |
| **Client Library** | @supabase/supabase-js | @neondatabase/serverless or pg |
| **Pricing** | Free tier: 500MB, 2GB transfer | Free tier: 3GB, 5GB transfer |
| **Serverless** | Edge Functions | Works with Netlify/Vercel Functions |

---

## Key Changes Required

### ✅ Already Compatible
- Database schema (standard PostgreSQL)
- NextAuth authentication (already implemented)
- API routes structure
- All SQL queries

### ⚠️ Needs Updating
- Database client from `@supabase/supabase-js` to `@neondatabase/serverless`
- Auth logic (already using NextAuth, so minimal changes)
- Real-time features (if you were using Supabase Realtime, implement alternatives)
- File storage (if using Supabase Storage, migrate to S3/Cloudinary)

### 🔄 Migration Script Helper

You can automate the migration with a script:

```javascript
// migrate-to-neon.js
const { neon } = require('@neondatabase/serverless');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const sql = neon(process.env.DATABASE_URL);

async function migrateTable(tableName) {
  console.log(`Migrating ${tableName}...`);
  
  // Fetch from Supabase
  const { data, error } = await supabase.from(tableName).select('*');
  
  if (error) {
    console.error(`Error fetching ${tableName}:`, error);
    return;
  }
  
  // Insert into Neon
  for (const row of data) {
    const keys = Object.keys(row);
    const values = Object.values(row);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    
    await sql(
      `INSERT INTO ${tableName} (${keys.join(', ')}) 
       VALUES (${placeholders}) 
       ON CONFLICT (id) DO NOTHING`,
      values
    );
  }
  
  console.log(`✅ Migrated ${data.length} rows from ${tableName}`);
}

async function migrate() {
  const tables = [
    'programs',
    'students',
    'teachers',
    'courses',
    'rooms',
    'timetables',
    'change_requests'
  ];
  
  for (const table of tables) {
    await migrateTable(table);
  }
  
  console.log('🎉 Migration complete!');
}

migrate().catch(console.error);
```

---

## Troubleshooting

### Connection Issues
- Verify DATABASE_URL is correct and includes `?sslmode=require`
- Check Neon project is not paused (free tier pauses after inactivity)
- Ensure IP whitelist is configured (if applicable)

### Performance Issues
- Use connection pooling (enabled by default with @neondatabase/serverless)
- Consider upgrading to Neon's scale plan for higher limits
- Use database indexes on frequently queried columns

### SSL/TLS Errors
- Always include `?sslmode=require` in connection string
- Neon requires SSL for all connections

---

## Additional Resources

- [Neon Documentation](https://neon.tech/docs)
- [Netlify + Neon Integration](https://docs.netlify.com/integrations/neon/)
- [PostgreSQL Migration Guide](https://neon.tech/docs/import/migrate-from-postgres)
- [Next.js on Netlify](https://docs.netlify.com/frameworks/next-js/overview/)

---

## Support

If you encounter issues during migration:
1. Check Neon status page: https://neon.tech/status
2. Review Netlify deploy logs
3. Check database connection in Neon Console
4. Test queries in Neon SQL Editor

---

**Need help?** Create an issue in the repository or consult the Neon community forum.
