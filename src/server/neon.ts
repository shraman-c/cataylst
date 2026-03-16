import { neon } from "@neondatabase/serverless";

type DbProvider = 'neon' | 'd1';

const DB_PROVIDER = (process.env.DB_PROVIDER || 'neon').toLowerCase() as DbProvider;

const DATABASE_URL = process.env.DATABASE_URL;
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_D1_DATABASE_ID = process.env.CF_D1_DATABASE_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;

let neonSql: ReturnType<typeof neon> | null = null;

function getNeonClient(): ReturnType<typeof neon> {
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined. Set it in your environment when DB_PROVIDER=neon.');
  }

  if (!neonSql) {
    neonSql = neon(DATABASE_URL);
  }

  return neonSql;
}

function ensureD1Env(): void {
  if (!CF_ACCOUNT_ID || !CF_D1_DATABASE_ID || !CF_API_TOKEN) {
    throw new Error(
      'Missing Cloudflare D1 env vars. Required: CF_ACCOUNT_ID, CF_D1_DATABASE_ID, CF_API_TOKEN when DB_PROVIDER=d1.'
    );
  }
}

async function d1Query(text: string): Promise<any[]> {
  ensureD1Env();

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_DATABASE_ID}/query`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql: text }),
  });

  const payload = await response.json();

  if (!response.ok || !payload?.success) {
    const errorMessage = payload?.errors?.map((e: { message?: string }) => e.message).join('; ') || 'Unknown D1 API error';
    throw new Error(`D1 query failed: ${errorMessage}`);
  }

  return payload?.result?.[0]?.results || [];
}

function escapeSqlValue(value: any): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : 'NULL';
  }

  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }

  if (typeof value === 'object') {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  }

  return `'${String(value).replace(/'/g, "''")}'`;
}

function interpolateParams(text: string, params?: any[]): string {
  if (!params || params.length === 0) {
    return text;
  }

  return text.replace(/\$(\d+)/g, (_match, group) => {
    const index = Number(group) - 1;
    const value = params[index];
    return escapeSqlValue(value);
  });
}

export async function query(text: string, params?: any[]): Promise<any[]> {
  try {
    const finalQuery = interpolateParams(text, params);

    if (DB_PROVIDER === 'd1') {
      return await d1Query(finalQuery);
    }

    const sql = getNeonClient();
    return (await sql`${sql.unsafe(finalQuery)}`) as any[];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Get all records from a table
 */
export async function getAll(tableName: string): Promise<any[]> {
  return await query(`SELECT * FROM ${tableName} ORDER BY id`);
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
    const placeholders = values.map((value) => escapeSqlValue(value)).join(', ');
    
    // Use UPSERT for tables that support it (courses and students)
    let result;
    if (tableName === 'courses' || tableName === 'students') {
      // Create SET clause for UPDATE part
      const updateColumns = keys.filter(k => k !== 'custom_id').map(k => {
        const value = item[k];
        return `${k} = ${escapeSqlValue(value)}`;
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
  const placeholders = values.map((value) => escapeSqlValue(value)).join(', ');
  
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
    return `${key} = ${escapeSqlValue(value)}`;
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

export const sql = null;
