import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/server/neon';

/**
 * Test API endpoint to verify Neon database connection
 * Usage: GET /api/test/neon-connection
 */
export async function GET(request: NextRequest) {
  try {
    // Test basic connection
    const result = await query('SELECT NOW() as current_time, version() as version');
    
    if (result && result.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Neon database connection successful!',
        data: {
          current_time: result[0].current_time,
          database_version: result[0].version,
          connection_status: 'Connected to Neon PostgreSQL'
        }
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Connection established but no data returned',
        error: 'Empty result set'
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Neon connection error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to connect to Neon database',
      error: error.message || 'Unknown error',
      details: {
        code: error.code,
        severity: error.severity,
        hint: 'Check your DATABASE_URL in .env file'
      }
    }, { status: 500 });
  }
}

/**
 * Test database operations
 * Usage: POST /api/test/neon-connection
 * Body: { "test": "create_table" | "insert_data" | "query_data" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { test } = body;

    switch (test) {
      case 'create_table':
        // Create a test table
        await query(`
          CREATE TABLE IF NOT EXISTS test_connection (
            id SERIAL PRIMARY KEY,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        return NextResponse.json({
          success: true,
          message: 'Test table created successfully'
        });

      case 'insert_data':
        // Insert test data
        const insertResult = await query(
          'INSERT INTO test_connection (message) VALUES ($1) RETURNING *',
          [`Test connection at ${new Date().toISOString()}`]
        );
        
        return NextResponse.json({
          success: true,
          message: 'Test data inserted successfully',
          data: insertResult[0]
        });

      case 'query_data':
        // Query test data
        const queryResult = await query(
          'SELECT * FROM test_connection ORDER BY created_at DESC LIMIT 5'
        );
        
        return NextResponse.json({
          success: true,
          message: 'Test data retrieved successfully',
          data: queryResult
        });

      case 'cleanup':
        // Clean up test table
        await query('DROP TABLE IF EXISTS test_connection');
        
        return NextResponse.json({
          success: true,
          message: 'Test table cleaned up successfully'
        });

      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid test type. Use: create_table, insert_data, query_data, or cleanup'
        }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Neon test operation error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Test operation failed',
      error: error.message || 'Unknown error'
    }, { status: 500 });
  }
}