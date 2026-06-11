import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { readAccountRegistry } from '@/lib/auth-registry';
import { createSupabaseAdminClient } from '@/lib/supabase-auth';

// Schema for password generation request
const GeneratePasswordSchema = z.object({
  userId: z.string(),
  userType: z.enum(['student', 'teacher', 'admin']),
  newPassword: z.string().optional(), // If not provided, will generate random
});

// Schema for user lookup
const UserLookupSchema = z.object({
  searchTerm: z.string(),
  userType: z.enum(['student', 'teacher', 'admin', 'all']),
});

// POST /api/auth/generate-password - Generate/reset password for a user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validation = GeneratePasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid password generation data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { userId, userType, newPassword } = validation.data;

    const generatedPassword = newPassword || generateRandomPassword();
    const registry = await readAccountRegistry();
    const account = registry.find((entry) => {
      if (userType === 'admin') {
        return entry.role === 'admin' && (entry.id === userId || entry.profileId === userId || entry.username === userId || entry.email === userId);
      }

      return entry.role === userType && (entry.id === userId || entry.profileId === userId || entry.username === userId || entry.email === userId);
    });

    if (!account?.authUserId) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.auth.admin.updateUserById(account.authUserId, {
      password: generatedPassword,
    });

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to update password' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      userId,
      userType,
      newPassword: generatedPassword,
      message: 'Password generated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to generate password:', error);
    return NextResponse.json({ error: 'Failed to generate password' }, { status: 500 });
  }
}

// GET /api/auth/generate-password - Search for users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search') || '';
    const userType = searchParams.get('type') || 'all';
    
    // Validate the search parameters
    const validation = UserLookupSchema.safeParse({ searchTerm, userType });
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: validation.error.errors },
        { status: 400 }
      );
    }

    const registry = await readAccountRegistry();
    let filteredUsers = registry.map((entry) => ({
      id: entry.profileId || entry.id || entry.username || entry.email || '',
      name: entry.name || '',
      type: entry.role || 'student',
      email: entry.email || '',
      department: '',
    }));
    
    if (userType !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.type === userType);
    }
    
    if (searchTerm) {
      filteredUsers = filteredUsers.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return NextResponse.json(filteredUsers);
  } catch (error) {
    console.error('Failed to search users:', error);
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
  }
}

// Helper function to generate random password
function generateRandomPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*';
  const length = 12;
  let password = '';
  
  // Ensure at least one of each type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
  password += '@#$%^&*'[Math.floor(Math.random() * 7)]; // Special char
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}