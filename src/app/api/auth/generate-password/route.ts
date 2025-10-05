import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

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
    
    // Generate random password if not provided
    const generatedPassword = newPassword || generateRandomPassword();
    
    // In a real app, you would:
    // 1. Verify the user exists
    // 2. Hash the password
    // 3. Update the user's password in the database
    // 4. Log the password change event
    
    // For now, just return success with the generated password
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

    // In a real app, you would search the database for users
    // For now, return mock data based on the current system
    const mockUsers = [
      // Students
      { id: 'S001', name: 'John Doe', type: 'student', email: 'john.doe@student.edu', department: 'CSE' },
      { id: 'S002', name: 'Jane Smith', type: 'student', email: 'jane.smith@student.edu', department: 'ECE' },
      { id: 'S003', name: 'Mike Johnson', type: 'student', email: 'mike.johnson@student.edu', department: 'MECH' },
      
      // Teachers
      { id: 'T001', name: 'Dr. Alice Johnson', type: 'teacher', email: 'alice.johnson@faculty.edu', department: 'CSE' },
      { id: 'T002', name: 'Prof. Bob Wilson', type: 'teacher', email: 'bob.wilson@faculty.edu', department: 'ECE' },
      { id: 'T003', name: 'Dr. Carol Brown', type: 'teacher', email: 'carol.brown@faculty.edu', department: 'Mathematics' },
      
      // Admins
      { id: 'A001', name: 'Admin User', type: 'admin', email: 'admin@university.edu', department: 'Administration' },
    ];

    // Filter users based on search term and type
    let filteredUsers = mockUsers;
    
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