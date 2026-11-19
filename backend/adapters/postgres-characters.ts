import type { Pool, PoolClient } from 'pg';
import type { CharacterDocument, CharacterRecord, CharacterRepository, CharacterSummary } from '../domain/characters.js';
import { AppError, requireCondition } from '../domain/errors.js';

interface Row { document: CharacterDocument; version: number; updated_at: Date; last_mutation: string; deleted_at: Date | null }
const record = (row: Row): CharacterRecord => ({ document: row.document, version: row.version, updatedAt: row.updated_at.getTime() });
export class PostgresCharacters implements CharacterRepository {
  constructor(private readonly pool: Pool) {}
  private async withOwner<T>(owner: string, write: boolean, action: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect(); let broken = false;
    try {
      await client.query('BEGIN');
      await client.query("SET LOCAL lock_timeout = '8s'");
      await client.query("SET LOCAL statement_timeout = '12s'");
      await client.query("SELECT set_config('primordios.user_id', $1, true)", [owner]);
      if (write) await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 8392))', [owner]);
      const result = await action(client); await client.query('COMMIT'); return result;
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch { broken = true; }
      if ((error as { code?: string }).code === '23505') throw new AppError(409, 'CHARACTER_EXISTS', 'Já existe uma ficha com esse identificador.');
      throw error;
    } finally { client.release(broken); }
  }
  private async row(client: PoolClient, owner: string, id: string): Promise<Row | undefined> {
    return (await client.query<Row>('SELECT document, version, updated_at, last_mutation, deleted_at FROM private.characters WHERE owner_id=$1 AND id=$2', [owner,id])).rows[0];
  }
  list(owner: string): Promise<CharacterSummary[]> {
    return this.withOwner(owner, false, async client => {
      const result = await client.query<{ id: string; nomePersonagem: string; classe: string; nivel: number; desc: string; hasPhoto: boolean; version: number; updated_at: Date }>(`
        SELECT id, document->>'nomePersonagem' AS "nomePersonagem", document->>'classe' AS classe,
          (document->>'nivel')::integer AS nivel, left(document->>'desc', 300) AS "desc",
          coalesce(document->>'foto','') <> '' AS "hasPhoto", version, updated_at
        FROM private.characters WHERE owner_id=$1 AND deleted_at IS NULL ORDER BY updated_at DESC, id LIMIT 100`, [owner]);
      return result.rows.map(({ updated_at, ...row }) => ({ ...row, updatedAt: updated_at.getTime() }));
    });
  }
  get(owner: string, id: string): Promise<CharacterRecord | undefined> {
    return this.withOwner(owner, false, async client => { const row = await this.row(client, owner, id); return row && !row.deleted_at ? record(row) : undefined; });
  }
  create(owner: string, document: CharacterDocument, mutation: string, importKey: string | null): Promise<CharacterRecord> {
    return this.withOwner(owner, true, async client => {
      const previous = await this.row(client, owner, document.id);
      if (previous?.last_mutation === mutation && !previous.deleted_at) return record(previous);
      if (importKey) {
        const imported = (await client.query<Row>('SELECT document, version, updated_at, last_mutation, deleted_at FROM private.characters WHERE owner_id=$1 AND import_key=$2', [owner,importKey])).rows[0];
        if (imported && !imported.deleted_at) return record(imported);
        requireCondition(!imported, 409, 'IMPORT_DELETED', 'Esta ficha já foi importada e excluída.');
      }
      const total = (await client.query<{ count: number }>('SELECT count(*)::integer AS count FROM private.characters WHERE owner_id=$1 AND deleted_at IS NULL', [owner])).rows[0]?.count ?? 0;
      requireCondition(total < 100, 409, 'CHARACTER_LIMIT', 'O limite atual é de 100 fichas por conta.');
      const result = await client.query<Row>(`INSERT INTO private.characters (id,owner_id,document,last_mutation,import_key)
        VALUES ($1,$2,$3::jsonb,$4,$5) RETURNING document,version,updated_at,last_mutation,deleted_at`, [document.id,owner,JSON.stringify(document),mutation,importKey]);
      return record(result.rows[0]!);
    });
  }
  update(owner: string, document: CharacterDocument, version: number, mutation: string): Promise<CharacterRecord> {
    return this.withOwner(owner, true, async client => {
      const previous = await this.row(client, owner, document.id);
      requireCondition(previous && !previous.deleted_at, 404, 'CHARACTER_NOT_FOUND', 'Ficha não encontrada.');
      if (previous.last_mutation === mutation) return record(previous);
      requireCondition(previous.version === version, 409, 'CHARACTER_CONFLICT', 'Esta ficha foi alterada em outro lugar. Sua edição foi preservada neste navegador.');
      const result = await client.query<Row>(`UPDATE private.characters SET document=$3::jsonb, version=version+1, updated_at=now(), last_mutation=$4
        WHERE owner_id=$1 AND id=$2 RETURNING document,version,updated_at,last_mutation,deleted_at`, [owner,document.id,JSON.stringify(document),mutation]);
      return record(result.rows[0]!);
    });
  }
  async remove(owner: string, id: string, version: number, mutation: string): Promise<void> {
    await this.withOwner(owner, true, async client => {
      const previous = await this.row(client, owner, id);
      requireCondition(previous, 404, 'CHARACTER_NOT_FOUND', 'Ficha não encontrada.');
      if (previous.deleted_at) return;
      requireCondition(previous.version === version, 409, 'CHARACTER_CONFLICT', 'A ficha foi alterada em outro lugar. Atualize a lista antes de excluir.');
      // Mantém somente um túmulo mínimo para retentativas/importações idempotentes.
      await client.query(`UPDATE private.characters SET document=jsonb_build_object('id',id::text,'nivel',1),
        deleted_at=now(),updated_at=now(),version=version+1,last_mutation=$3 WHERE owner_id=$1 AND id=$2`, [owner,id,mutation]);
    });
  }
}
