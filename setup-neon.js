#!/usr/bin/env node

/**
 * Setup script for migrating Catalyst to Neon (Netlify Postgres)
 * 
 * Run: node setup-neon.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Neon for Catalyst...\n');

// Step 1: Install Neon package
console.log('📦 Installing @neondatabase/serverless...');
try {
  execSync('npm install @neondatabase/serverless', { stdio: 'inherit' });
  console.log('✅ Package installed successfully\n');
} catch (error) {
  console.error('❌ Failed to install package:', error.message);
  process.exit(1);
}

// Step 2: Check if DATABASE_URL is in .env
console.log('🔍 Checking environment configuration...');
const envPath = path.join(process.cwd(), '.env');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  
  if (!envContent.includes('DATABASE_URL')) {
    console.log('📝 Adding DATABASE_URL placeholder to .env...');
    const newContent = envContent + '\n\n# Neon Database (comment out Supabase vars above to use this)\n# DATABASE_URL=postgresql://user:password@host/neondb?sslmode=require\n';
    fs.writeFileSync(envPath, newContent);
    console.log('✅ Added DATABASE_URL to .env\n');
  } else {
    console.log('✅ DATABASE_URL already exists in .env\n');
  }
} else {
  console.log('⚠️  No .env file found. Creating from .env.example...');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env from .env.example\n');
  } else {
    console.log('❌ No .env.example found. Please create .env manually.\n');
  }
}

// Step 3: Summary
console.log('📋 Next Steps:\n');
console.log('1. Create a Neon database:');
console.log('   → Visit https://neon.tech or use Netlify\'s Neon integration');
console.log('   → Copy your connection string (use the pooled connection)');
console.log('');
console.log('2. Update your .env file:');
console.log('   → Add: DATABASE_URL=postgresql://user:password@host/neondb?sslmode=require');
console.log('   → (Optional) Comment out SUPABASE_* variables if switching fully');
console.log('');
console.log('3. Import your database schema:');
console.log('   → Run: psql "$DATABASE_URL" < create-database-schema.sql');
console.log('   → Or use Neon\'s SQL Editor in the web console');
console.log('');
console.log('4. Update your API routes to use Neon:');
console.log('   → Replace: import { ... } from \'@/server/supabase\'');
console.log('   → With:    import { ... } from \'@/server/neon\'');
console.log('');
console.log('5. Test locally:');
console.log('   → npm run dev');
console.log('');
console.log('6. Deploy to Netlify:');
console.log('   → netlify deploy --prod');
console.log('');
console.log('📖 For detailed migration guide, see NEON_MIGRATION.md');
console.log('');
console.log('✨ Setup complete! Happy coding!');
