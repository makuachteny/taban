/**
 * PostgreSQL Client — server-side only.
 *
 * Uses the `pg` package to connect to the national analytics database.
 * Connection pooling is used for efficiency across API route invocations.
 *
 * NOTE: This module must only be imported in server-side code (API routes,
 * server components). Never import it in client components.
 */

import { Pool, type PoolConfig } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const config: PoolConfig = {
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      // SSL in production
      ...(process.env.NODE_ENV === 'production' ? {
        ssl: { rejectUnauthorized: false },
      } : {}),
    };

    pool = new Pool(config);

    pool.on('error', (err) => {
      console.error('[PostgreSQL] Unexpected pool error:', err);
    });
  }

  return pool;
}

/** Execute a parameterized query */
export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number | null }> {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return { rows: result.rows as T[], rowCount: result.rowCount };
  } finally {
    client.release();
  }
}

/** Upsert a document from CouchDB into the corresponding PostgreSQL table */
export async function upsertDocument(
  table: string,
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  // Build column list and values dynamically
  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = columns.map((_, i) => `$${i + 1}`);

  // Build SET clause for ON CONFLICT (exclude 'id' from updates)
  const updateColumns = columns.filter(c => c !== 'id');
  const setClauses = updateColumns.map(c => {
    const idx = columns.indexOf(c) + 1;
    return `${c} = $${idx}`;
  });

  const sql = `
    INSERT INTO ${table} (${columns.join(', ')})
    VALUES (${placeholders.join(', ')})
    ON CONFLICT (id) DO UPDATE SET
      ${setClauses.join(',\n      ')}
  `;

  await query(sql, values);
}

/** Delete a document by ID from a table */
export async function deleteDocument(table: string, id: string): Promise<void> {
  await query(`DELETE FROM ${table} WHERE id = $1`, [id]);
}

/** Close the connection pool (for graceful shutdown) */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
