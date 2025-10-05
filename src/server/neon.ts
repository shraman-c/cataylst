import { neon } from "@neondatabase/serverless";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config(); // Also load .env as fallback

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined. Please add it to your .env.local file.');
}

const sql = neon(DATABASE_URL);

export async function query(text: string): Promise<any[]> {
  try {
    // Use template literal syntax as required by Neon
    return await sql`${sql.unsafe(text)}`;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Get all records from a table
 */
export async function getAll(tableName: string): Promise<any[]> {
  return await sql`SELECT * FROM ${sql.unsafe(tableName)} ORDER BY id`;
}

/**
 * Insert multiple records into a table using UPSERT (preserves existing data)
 */
export async function insertMany(tableName: string, data: any[]): Promise<any[]> {
  if (!data || data.length === 0) return [];
  
  const results = [];
  
  for (const item of data) {
    const keys = Object.keys(item);
    const values = keys.map(key => item[key]);
    
    // Build UPSERT query for courses table
    const columns = keys.join(', ');
    const placeholders = values.map((value, index) => {
      if (typeof value === 'string') {
        return `'${value.replace(/'/g, "''")}'`;
      } else if (typeof value === 'object' && value !== null) {
        return `'${JSON.stringify(value)}'::jsonb`;
      } else if (value === null || value === undefined) {
        return 'NULL';
      } else {
        return value;
      }
    }).join(', ');
    
    // Use UPSERT for tables that support it (courses and students)
    let result;
    if (tableName === 'courses' || tableName === 'students') {
      // Create SET clause for UPDATE part
      const updateColumns = keys.filter(k => k !== 'custom_id').map(k => {
        const value = item[k];
        if (typeof value === 'string') {
          return `${k} = '${value.replace(/'/g, "''")}'`;
        } else if (typeof value === 'object' && value !== null) {
          return `${k} = '${JSON.stringify(value)}'::jsonb`;
        } else if (value === null || value === undefined) {
          return `${k} = NULL`;
        } else {
          return `${k} = ${value}`;
        }
      }).join(', ');
      
      result = await query(`
        INSERT INTO ${tableName} (${columns}) 
        VALUES (${placeholders}) 
        ON CONFLICT (custom_id) 
        DO UPDATE SET ${updateColumns}
        RETURNING *
      `);
    } else {
      // For other tables, use simple insert
      result = await query(`
        INSERT INTO ${tableName} (${columns}) 
        VALUES (${placeholders}) 
        RETURNING *
      `);
    }
    
    if (result.length > 0) {
      results.push(result[0]);
    }
  }
  
  return results;
}

/**
 * Find records with optional conditions
 */
export async function find(tableName: string, conditions?: { where?: string }): Promise<any[]> {
  let queryText = `SELECT * FROM ${tableName}`;
  
  if (conditions?.where) {
    queryText += ` WHERE ${conditions.where}`;
  }
  
  queryText += ' ORDER BY id';
  
  return await query(queryText);
}

/**
 * Insert a single record into a table
 */
export async function insert(tableName: string, data: any): Promise<any> {
  const keys = Object.keys(data);
  const values = keys.map(key => data[key]);
  
  // Build INSERT query
  const columns = keys.join(', ');
  const placeholders = values.map((value, index) => {
    if (typeof value === 'string') {
      return `'${value.replace(/'/g, "''")}'`;
    } else if (typeof value === 'object' && value !== null) {
      return `'${JSON.stringify(value)}'::jsonb`;
    } else {
      return value;
    }
  }).join(', ');
  
  const result = await query(`
    INSERT INTO ${tableName} (${columns}) 
    VALUES (${placeholders}) 
    RETURNING *
  `);
  
  return result[0] || null;
}

/**
 * Update a single record in a table
 */
export async function update(tableName: string, id: string, data: any): Promise<any> {
  const keys = Object.keys(data);
  
  const setClause = keys.map(key => {
    const value = data[key];
    if (typeof value === 'string') {
      return `${key} = '${value.replace(/'/g, "''")}'`;
    } else if (typeof value === 'object' && value !== null) {
      return `${key} = '${JSON.stringify(value)}'::jsonb`;
    } else if (value === null || value === undefined) {
      return `${key} = NULL`;
    } else {
      return `${key} = ${value}`;
    }
  }).join(', ');
  
  const result = await query(`
    UPDATE ${tableName} 
    SET ${setClause}
    WHERE custom_id = '${id.replace(/'/g, "''")}'
    RETURNING *
  `);
  
  return result[0] || null;
}

/**
 * Delete a single record from a table by custom_id
 */
export async function deleteOne(tableName: string, id: string): Promise<boolean> {
  const result = await query(`
    DELETE FROM ${tableName} 
    WHERE custom_id = '${id.replace(/'/g, "''")}'
    RETURNING custom_id
  `);
  
  return result.length > 0;
}

// Supabase-compatible collections interface for easy migration
export function collections() {
  return {
    students: {
      find: () => ({ data: getAll('students'), error: null }),
      insertMany: (data: any[]) => ({ data: insertMany('students', data), error: null }),
      deleteMany: () => query('DELETE FROM students'),
    },
    teachers: {
      find: () => ({ data: getAll('teachers'), error: null }),
      insertMany: (data: any[]) => ({ data: insertMany('teachers', data), error: null }),
      deleteMany: () => query('DELETE FROM teachers'),
    },
    courses: {
      find: () => ({ data: getAll('courses'), error: null }),
      insertMany: (data: any[]) => ({ data: insertMany('courses', data), error: null }),
      deleteMany: () => query('DELETE FROM courses'),
    },
    rooms: {
      find: () => ({ data: getAll('rooms'), error: null }),
      insertMany: (data: any[]) => ({ data: insertMany('rooms', data), error: null }),
      deleteMany: () => query('DELETE FROM rooms'),
    },
    timetables: {
      find: () => ({ data: getAll('timetables'), error: null }),
      insertMany: (data: any[]) => ({ data: insertMany('timetables', data), error: null }),
      deleteMany: () => query('DELETE FROM timetables'),
    },
    sections: {
      find: () => ({ data: getAll('sections'), error: null }),
      insertMany: (data: any[]) => ({ data: insertMany('sections', data), error: null }),
      deleteMany: () => query('DELETE FROM sections'),
    },
  };
}

export { sql };
