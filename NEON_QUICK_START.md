# Quick Reference: Neon Migration

## 🎯 Quick Start (5 Minutes)

### 1. Install Neon Package
```bash
npm install @neondatabase/serverless
# or run the setup script
node setup-neon.js
```

### 2. Create Neon Database
- Sign up at https://neon.tech
- Create new project → Copy **Pooled Connection String**
- Format: `postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`

### 3. Update .env
```env
# Add this line
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require

# Keep Supabase vars for now (during transition)
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 4. Import Schema
```bash
# Using psql
psql "$DATABASE_URL" < create-database-schema.sql

# Or use Neon SQL Editor (Web UI)
# Copy/paste contents of create-database-schema.sql
```

### 5. Update One API Route (Test)
```typescript
// Before (Supabase)
import { getSupabaseClient } from '@/server/supabase';

// After (Neon)
import { getAll, insert, update, deleteRecord } from '@/server/neon';
```

### 6. Test Locally
```bash
npm run dev
# Visit http://localhost:9002
```

### 7. Deploy to Netlify
```bash
netlify env:set DATABASE_URL "your_connection_string"
netlify deploy --prod
```

---

## 📝 Database Client Comparison

### Supabase Style
```typescript
const supabase = getSupabaseClient();
const { data, error } = await supabase
  .from('students')
  .select('*');
```

### Neon Style (Recommended)
```typescript
import { getAll } from '@/server/neon';
const students = await getAll('students');
```

### Neon Style (Alternative - Supabase-compatible)
```typescript
import { db } from '@/server/neon';
const { data, error } = await db.from('students').select('*');
```

---

## 🔄 Migration Strategies

### Strategy A: Gradual Migration (Recommended)
1. Keep both Supabase and Neon running
2. Migrate one API route at a time
3. Test each change
4. Switch fully once all routes work

### Strategy B: Full Migration
1. Export all data from Supabase
2. Import to Neon
3. Update all imports at once
4. Test thoroughly
5. Deploy

### Strategy C: Hybrid (Multi-DB)
1. Keep Supabase for auth/storage
2. Use Neon for main database
3. Best of both worlds

---

## 🛠️ Common Operations

### Create Record
```typescript
const student = await insert('students', {
  custom_id: 'STU001',
  name: 'John Doe',
  student_id: '2024001',
  program_id: 'PROG001',
  current_semester: 1
});
```

### Get All Records
```typescript
const students = await getAll('students');
```

### Get by ID
```typescript
const student = await getById('students', 'uuid-or-custom-id');
```

### Update Record
```typescript
const updated = await update('students', 'STU001', {
  current_semester: 2
});
```

### Delete Record
```typescript
const deleted = await deleteRecord('students', 'STU001');
```

### Custom Query
```typescript
import { query } from '@/server/neon';

const results = await query(
  'SELECT * FROM students WHERE current_semester = $1',
  [2]
);
```

---

## 🚀 Netlify Deployment Checklist

- [ ] Install `@neondatabase/serverless`
- [ ] Create Neon database
- [ ] Import schema to Neon
- [ ] Update `.env` with `DATABASE_URL`
- [ ] Test locally with `npm run dev`
- [ ] Update API routes to use Neon
- [ ] Create `netlify.toml` (already created)
- [ ] Set env vars in Netlify Dashboard
- [ ] Deploy: `netlify deploy --prod`
- [ ] Test production deployment
- [ ] Monitor logs: `netlify logs`

---

## 🔗 Helpful Links

- **Full Migration Guide:** See [NEON_MIGRATION.md](./NEON_MIGRATION.md)
- **Neon Docs:** https://neon.tech/docs
- **Netlify Neon Integration:** https://docs.netlify.com/integrations/neon/
- **Neon Console:** https://console.neon.tech
- **Netlify Dashboard:** https://app.netlify.com

---

## ⚡ Performance Tips

1. **Use Pooled Connection:** Always use the pooled connection string from Neon
2. **Connection Caching:** The Neon client automatically caches connections (enabled by default)
3. **Database Indexes:** Add indexes to frequently queried columns
4. **Query Optimization:** Use `SELECT` with specific columns instead of `*`
5. **Batch Operations:** Use `insertMany` for bulk inserts

---

## 🐛 Troubleshooting

### "Cannot find module '@neondatabase/serverless'"
```bash
npm install @neondatabase/serverless
```

### "Connection timeout" or "Connection refused"
- Check DATABASE_URL is correct
- Ensure `?sslmode=require` is in connection string
- Verify Neon project is not paused (free tier auto-pauses)

### "Table does not exist"
- Run schema import: `psql "$DATABASE_URL" < create-database-schema.sql`
- Or use Neon SQL Editor to create tables

### Build fails on Netlify
- Check all env vars are set in Netlify Dashboard
- Ensure `@neondatabase/serverless` is in `dependencies` (not `devDependencies`)
- Check build logs for specific errors

---

## 💰 Cost Comparison

| Feature | Supabase Free | Neon Free |
|---------|---------------|-----------|
| Storage | 500 MB | 3 GB |
| Data Transfer | 2 GB | 5 GB |
| Compute | Shared | 0.25 vCPU |
| Projects | 2 | Unlimited |
| Branches | ❌ | ✅ |

**Note:** Both offer generous free tiers for development and small projects.
