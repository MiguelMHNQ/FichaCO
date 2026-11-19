import test from 'node:test';
import assert from 'node:assert/strict';
import type {Pool} from 'pg';
import {PostgresUploads} from '../adapters/postgres-uploads.js';
test('reserva limita GIF a 10 MiB e vídeo a 40 MiB antes de acessar armazenamento',async()=>{
 let queries=0;const uploads=new PostgresUploads({query:async()=>{queries++;return {rows:[]};}} as unknown as Pool),user={id:'11111111-1111-4111-8111-111111111111',displayName:'Teste'};
 for(const [mime,limit,ext] of [['image/gif',10,'gif'],['video/mp4',40,'mp4'],['video/webm',40,'webm']] as const){
  const result=await uploads.reserve(user,'123456',{mime,size:limit*1024*1024});assert.ok(result.path.endsWith('.'+ext));
  await assert.rejects(uploads.reserve(user,'123456',{mime,size:limit*1024*1024+1}),{code:'INVALID_UPLOAD'});
 }
 assert.equal(queries,3);
});
