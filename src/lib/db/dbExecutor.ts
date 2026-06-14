import { Pool } from 'pg';
import { MongoClient } from 'mongodb';
import type { Column, Row } from '@/types/dataset';

/**
 * Validates that a SQL query is read-only.
 */
export function validateSqlQuery(sql: string): void {
  // Remove comments (single line and multi-line) to prevent keyword concealment
  const cleanSql = sql.replace(/\/\*[\s\S]*?\*\/|--.*$/gm, '').trim();
  const upperSql = cleanSql.toUpperCase();

  // Enforce query starts with SELECT or WITH
  if (!upperSql.startsWith('SELECT') && !upperSql.startsWith('WITH')) {
    throw new Error('Security Alert: Only SELECT or WITH queries are allowed.');
  }

  const forbidden = [
    'DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'TRUNCATE',
    'CREATE', 'REPLACE', 'GRANT', 'REVOKE', 'INTO'
  ];

  for (const word of forbidden) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(cleanSql)) {
      throw new Error(`Security Alert: Forbidden keyword "${word}" detected. Only read-only operations are allowed.`);
    }
  }
}

/**
 * Validates that a MongoDB aggregation pipeline contains only read-only stages.
 */
export function validateMongoPipeline(pipeline: any[]): void {
  if (!Array.isArray(pipeline)) {
    throw new Error('Security Alert: MongoDB aggregation pipeline must be an array.');
  }

  const forbiddenStages = [
    '$out', '$merge', '$writeConcern', '$accumulator', '$function'
  ];

  for (const stage of pipeline) {
    const keys = Object.keys(stage);
    for (const key of keys) {
      if (forbiddenStages.includes(key)) {
        throw new Error(`Security Alert: Forbidden stage "${key}" detected. Only read-only stages are allowed.`);
      }
    }
  }
}

/**
 * Tests connection to a database string and returns list of tables/collections.
 */
export async function testConnection(
  dbType: 'mongodb' | 'postgresql',
  connectionString: string
): Promise<string[]> {
  if (dbType === 'postgresql') {
    const pool = new Pool({ connectionString, connectionTimeoutMillis: 5000 });
    try {
      const client = await pool.connect();
      try {
        const res = await client.query(`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
          ORDER BY table_name ASC
        `);
        return res.rows.map(r => r.table_name);
      } finally {
        client.release();
      }
    } finally {
      await pool.end();
    }
  } else if (dbType === 'mongodb') {
    const client = new MongoClient(connectionString, { connectTimeoutMS: 5000 });
    try {
      await client.connect();
      const db = client.db();
      const collections = await db.listCollections().toArray();
      return collections.map(c => c.name).sort();
    } finally {
      await client.close();
    }
  } else {
    throw new Error('Unsupported database type.');
  }
}

/**
 * Connects to the database and extracts columns, types, and sample rows (limit 100).
 */
export async function getSchemaAndSample(
  dbType: 'mongodb' | 'postgresql',
  connectionString: string,
  tableOrCollection: string
): Promise<{ columns: Column[]; sampleRows: Row[]; rowCount: number }> {
  if (dbType === 'postgresql') {
    const pool = new Pool({ connectionString, connectionTimeoutMillis: 5000 });
    try {
      const client = await pool.connect();
      try {
        // 1. Fetch column names and types
        const colRes = await client.query(`
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_name = $1 AND table_schema = 'public'
        `, [tableOrCollection]);

        if (colRes.rowCount === 0) {
          throw new Error(`Table "${tableOrCollection}" not found or has no columns.`);
        }

        // 2. Fetch sample rows (limit 100)
        // Double-quote the table name to prevent SQL injection or case sensitivity issues
        const sampleRes = await client.query(`SELECT * FROM "${tableOrCollection}" LIMIT 100`);
        const sampleRows = sampleRes.rows;

        // 3. Fetch count
        const countRes = await client.query(`SELECT COUNT(*) as cnt FROM "${tableOrCollection}"`);
        const rowCount = parseInt(countRes.rows[0].cnt, 10) || 0;

        // Map postgres types to ColumnType
        const columns: Column[] = colRes.rows.map(row => {
          const pgType = String(row.data_type).toLowerCase();
          let type: 'string' | 'number' | 'date' | 'boolean' = 'string';

          if (
            pgType.includes('int') ||
            pgType.includes('num') ||
            pgType.includes('double') ||
            pgType.includes('real') ||
            pgType.includes('float') ||
            pgType.includes('dec')
          ) {
            type = 'number';
          } else if (pgType.includes('bool')) {
            type = 'boolean';
          } else if (pgType.includes('date') || pgType.includes('time') || pgType.includes('stamp')) {
            type = 'date';
          }

          // Gather sample values
          const name = row.column_name;
          const sampleValues = sampleRows
            .map(r => r[name])
            .filter(val => val !== null && val !== undefined)
            .slice(0, 5)
            .map(String);

          return { name, type, sampleValues };
        });

        return { columns, sampleRows, rowCount };
      } finally {
        client.release();
      }
    } finally {
      await pool.end();
    }
  } else if (dbType === 'mongodb') {
    const client = new MongoClient(connectionString, { connectTimeoutMS: 5000 });
    try {
      await client.connect();
      const db = client.db();
      
      // 1. Fetch sample documents (limit 100)
      const sampleDocs = await db.collection(tableOrCollection).find().limit(100).toArray();
      const rowCount = await db.collection(tableOrCollection).countDocuments();

      // Convert Mongo objects/IDs to strings/primitives for our rows
      const sampleRows: Row[] = sampleDocs.map(doc => {
        const row: Row = {};
        Object.entries(doc).forEach(([k, v]) => {
          if (k === '_id') {
            row._id = String(v);
          } else if (v instanceof Date) {
            row[k] = v.toISOString();
          } else if (v !== null && typeof v === 'object') {
            row[k] = JSON.stringify(v);
          } else {
            row[k] = v as any;
          }
        });
        return row;
      });

      // 2. Infer schema from sample documents
      const columnsMap = new Map<string, { type: 'string' | 'number' | 'date' | 'boolean'; sampleValues: Set<string> }>();
      
      sampleDocs.forEach(doc => {
        Object.entries(doc).forEach(([key, val]) => {
          // Normalize key
          const colName = key === '_id' ? '_id' : key;
          let type: 'string' | 'number' | 'date' | 'boolean' = 'string';

          if (typeof val === 'number') {
            type = 'number';
          } else if (typeof val === 'boolean') {
            type = 'boolean';
          } else if (val instanceof Date) {
            type = 'date';
          } else if (typeof val === 'string') {
            // Check if it's a parseable date string
            const timestamp = Date.parse(val);
            if (!isNaN(timestamp) && val.includes('-') && val.length >= 10) {
              type = 'date';
            }
          }

          if (!columnsMap.has(colName)) {
            columnsMap.set(colName, { type, sampleValues: new Set() });
          }
          if (val !== undefined && val !== null) {
            columnsMap.get(colName)!.sampleValues.add(key === '_id' ? String(val) : String(val));
          }
        });
      });

      const columns: Column[] = Array.from(columnsMap.entries()).map(([name, info]) => ({
        name,
        type: info.type,
        sampleValues: Array.from(info.sampleValues).slice(0, 5)
      }));

      return { columns, sampleRows, rowCount };
    } finally {
      await client.close();
    }
  } else {
    throw new Error('Unsupported database type.');
  }
}

/**
 * Connects to the database and runs a query safely.
 */
export async function runQuery(
  dbType: 'mongodb' | 'postgresql',
  connectionString: string,
  tableOrCollection: string,
  query: string
): Promise<Row[]> {
  if (dbType === 'postgresql') {
    validateSqlQuery(query);
    const pool = new Pool({ connectionString, connectionTimeoutMillis: 5000 });
    try {
      const client = await pool.connect();
      try {
        const res = await client.query(query);
        return res.rows;
      } finally {
        client.release();
      }
    } finally {
      await pool.end();
    }
  } else if (dbType === 'mongodb') {
    // MongoDB query is an aggregation pipeline array represented as a JSON string
    let pipeline: any[];
    try {
      pipeline = JSON.parse(query);
    } catch (err: any) {
      throw new Error(`Failed to parse MongoDB aggregation pipeline JSON: ${err.message}`);
    }

    validateMongoPipeline(pipeline);

    const client = new MongoClient(connectionString, { connectTimeoutMS: 5000 });
    try {
      await client.connect();
      const db = client.db();
      const res = await db.collection(tableOrCollection).aggregate(pipeline).toArray();
      
      // Map BSON types to normal JSON rows
      return res.map(doc => {
        const row: Row = {};
        Object.entries(doc).forEach(([k, v]) => {
          if (k === '_id') {
            // Project _id to string
            row._id = String(v);
          } else if (v instanceof Date) {
            row[k] = v.toISOString();
          } else if (v !== null && typeof v === 'object') {
            row[k] = JSON.stringify(v);
          } else {
            row[k] = v as any;
          }
        });
        return row;
      });
    } finally {
      await client.close();
    }
  } else {
    throw new Error('Unsupported database type.');
  }
}
