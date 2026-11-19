import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { sendStaticContent } from '../http/static-content.js';

test('arquivos estáticos suportam retomada por byte range, sufixo, HEAD e limites inválidos',async()=>{
  const server=http.createServer((req,res)=>sendStaticContent(res,Buffer.from('abcdef'),'audio/mpeg',req.method!,req.headers.range));
  server.listen(0,'127.0.0.1');await once(server,'listening');const address=server.address();assert.ok(address&&typeof address!=='string');const url=`http://127.0.0.1:${address.port}`;
  try{
    const part=await fetch(url,{headers:{Range:'bytes=2-4'}});assert.equal(part.status,206);assert.equal(part.headers.get('content-range'),'bytes 2-4/6');assert.equal(await part.text(),'cde');
    assert.equal(await(await fetch(url,{headers:{Range:'bytes=-2'}})).text(),'ef');
    const invalid=await fetch(url,{headers:{Range:'bytes=9-'}});assert.equal(invalid.status,416);assert.equal(invalid.headers.get('content-range'),'bytes */6');
    assert.equal((await fetch(url,{headers:{Range:'bytes=-0'}})).status,416);
    const head=await fetch(url,{method:'HEAD',headers:{Range:'bytes=1-2'}});assert.equal(head.status,200);assert.equal(head.headers.get('content-length'),'6');assert.equal(await head.text(),'');
  }finally{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
});
