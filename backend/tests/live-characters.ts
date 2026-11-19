// Diagnóstico opcional: repositório real dentro de uma transação externa revertida.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import { readSupabaseConfig } from '../config.js';
import { createPostgresPool } from '../adapters/postgres.js';
import { PostgresCharacters } from '../adapters/postgres-characters.js';
import { characterDocument, uuid } from '../domain/characters.js';

const config = readSupabaseConfig(); if (!config) throw new Error('Configuração ausente.');
const owner = uuid(process.env.TEST_OWNER_ID), outsider = randomUUID();
const pool = createPostgresPool(config), connection = await pool.connect();
const id = randomUUID(), importedId = randomUUID();
try {
  await connection.query('BEGIN');
  const wrapped = {
    query: async (sql: string, values?: unknown[]) => {
      if (sql === 'BEGIN') return connection.query('SAVEPOINT character_adapter_check');
      if (sql === 'COMMIT') return connection.query('RELEASE SAVEPOINT character_adapter_check');
      if (sql === 'ROLLBACK') { await connection.query('ROLLBACK TO SAVEPOINT character_adapter_check'); return connection.query('RELEASE SAVEPOINT character_adapter_check'); }
      return connection.query(sql, values);
    }, release: () => {}
  } as unknown as PoolClient;
  const repository = new PostgresCharacters({ connect: async () => wrapped } as unknown as Pool);
  const doc = characterDocument({ id, nomePersonagem:'Teste temporário',classe:'Guerreiro',nivel:1,foto:'',desc:'',dados:{fragmentados_pv:'19'},estadoCompleto:{} },owner);
  const createMutation = randomUUID(); const created = await repository.create(owner,doc,createMutation,null);
  assert.equal(created.version,1); assert.equal((await repository.create(owner,doc,createMutation,null)).version,1);
  assert.equal(await repository.get(outsider,id),undefined);
  await assert.rejects(repository.update(outsider,doc,1,randomUUID()),{code:'CHARACTER_NOT_FOUND'});
  await assert.rejects(repository.remove(outsider,id,1,randomUUID()),{code:'CHARACTER_NOT_FOUND'});
  const mutation = randomUUID(); const changed = {...doc,desc:'alterada'};
  assert.equal((await repository.update(owner,changed,1,mutation)).version,2);
  assert.equal((await repository.update(owner,changed,1,mutation)).version,2);
  await assert.rejects(repository.update(owner,doc,1,randomUUID()),{code:'CHARACTER_CONFLICT'});
  await assert.rejects(repository.remove(owner,id,1,randomUUID()),{code:'CHARACTER_CONFLICT'});
  const imported = {...doc,id:importedId}; const importKey='a'.repeat(64);
  await repository.create(owner,imported,randomUUID(),importKey);
  assert.equal((await repository.create(owner,{...doc,id:randomUUID()},randomUUID(),importKey)).document.id,importedId);
  await repository.remove(owner,id,2,randomUUID()); assert.equal(await repository.get(owner,id),undefined);
  await assert.rejects(repository.update(owner,doc,2,randomUUID()),{code:'CHARACTER_NOT_FOUND'});
  await connection.query('ROLLBACK');
  await connection.query('BEGIN'); await connection.query("SELECT set_config('primordios.user_id',$1,true)",[owner]);
  const remaining = await connection.query<{count:number}>('SELECT count(*)::integer AS count FROM private.characters WHERE id=ANY($1::uuid[])',[[id,importedId]]);
  assert.equal(remaining.rows[0]?.count,0); await connection.query('ROLLBACK');
  console.log('OK: PostgreSQL real, isolamento, revisões, repetição idempotente, importação e exclusão. Transação revertida; nenhum dado de teste persistido.');
} catch {
  await connection.query('ROLLBACK').catch(()=>{}); console.error('Falha na verificação real das fichas; transação revertida.'); process.exitCode=1;
} finally { connection.release(); await pool.end(); }
