import { Pool } from 'pg';
import type { SupabaseConfig } from '../config.js';
import { SUPABASE_ROOT_CA } from '../security/supabase-ca.js';

export function createPostgresPool(config: SupabaseConfig): Pool {
  const connection = new URL(config.databaseUrl);
  for (const field of ['sslmode','sslcert','sslkey','sslrootcert','uselibpqcompat']) connection.searchParams.delete(field);
  const pool = new Pool({ connectionString: connection.toString(), max: 3, connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 10_000, allowExitOnIdle: true, ssl: { rejectUnauthorized: true, ca: config.databaseCa ?? SUPABASE_ROOT_CA } });
  pool.on('error', () => console.error('Conexão ociosa com o banco foi encerrada.'));
  return pool;
}
