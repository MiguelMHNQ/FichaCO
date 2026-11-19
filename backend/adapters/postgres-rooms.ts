import type { Pool, PoolClient } from 'pg';
import type { Room, RoomRepository, RoomTransaction } from '../domain/models.js';
import type { SupabaseConfig } from '../config.js';
import { requireCondition } from '../domain/errors.js';
import type { AttemptLimiter } from '../security/rate-limit.js';
import { createPostgresPool } from './postgres.js';

export class PostgresRooms implements RoomRepository, AttemptLimiter {
  constructor(private readonly pool: Pool) {}

  static connect(config: SupabaseConfig): PostgresRooms {
    return new PostgresRooms(createPostgresPool(config));
  }

  async check(key: string, max = 10, windowMs = 60_000): Promise<void> {
    // Uma instrução atômica fora da transação da sala: a tentativa conta mesmo em falha.
    const result = await this.pool.query<{ count: number }>(`
      INSERT INTO private.api_attempts AS attempts (key, count, expires_at)
      VALUES ($1, 1, now() + ($2::double precision * interval '1 millisecond'))
      ON CONFLICT (key) DO UPDATE SET
        count = CASE WHEN attempts.expires_at <= now() THEN 1 ELSE LEAST(attempts.count + 1, 1000000) END,
        expires_at = CASE WHEN attempts.expires_at <= now() THEN EXCLUDED.expires_at ELSE attempts.expires_at END
      RETURNING count`, [key, windowMs]);
    requireCondition(result.rows[0] && result.rows[0].count <= max, 429, 'RATE_LIMITED', 'Muitas tentativas. Aguarde um minuto.');
  }

  async transaction<T>(operation: (tx: RoomTransaction) => Promise<T>, code?: string): Promise<T> {
    const client = await this.pool.connect();
    let broken = false;
    try {
      await client.query('BEGIN');
      await client.query("SET LOCAL lock_timeout = '8s'");
      await client.query("SET LOCAL statement_timeout = '12s'");
      // Salas independentes não bloqueiam umas às outras. Criação/listagem usam chave global.
      if (code !== undefined) await client.query('SELECT pg_advisory_xact_lock(762941, $1)', [Number(code)+10]);
      else await client.query('SELECT pg_advisory_xact_lock(762941, 1)');
      const result = await operation(this.transactionView(client));
      await client.query('COMMIT');
      return result;
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch { broken = true; }
      throw error;
    } finally { client.release(broken); }
  }

  private transactionView(client: PoolClient): RoomTransaction {
    return {
      get: async code => {
        const result = await client.query<{ document: Room }>('SELECT document FROM private.rooms WHERE code = $1', [code]);
        return result.rows[0]?.document;
      },
      put: async room => {
        await client.query(`INSERT INTO private.rooms (code, document) VALUES ($1, $2::jsonb)
          ON CONFLICT (code) DO UPDATE SET document = EXCLUDED.document`, [room.code, JSON.stringify(room)]);
      },
      list: async () => {
        const result = await client.query<{ document: Room }>("SELECT document - 'tabletop' - 'liveKey' AS document FROM private.rooms WHERE NOT (document->>'closed')::boolean ORDER BY code");
        return result.rows.map(row => row.document);
      }
    };
  }
}
