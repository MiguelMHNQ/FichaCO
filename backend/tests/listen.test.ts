import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { listenLocal } from '../http/listen-local.js';

test('porta ocupada: tenta a próxima e responde no endereço escolhido', async () => {
  const occupied = http.createServer(); occupied.listen(0, '127.0.0.1'); await once(occupied, 'listening');
  const address = occupied.address(); assert.ok(address && typeof address !== 'string');
  const server = http.createServer((_req,res) => res.end('ok')); const retries: number[] = [];
  try {
    const port = await listenLocal(server, address.port, 10, value => retries.push(value));
    assert.notEqual(port, address.port); assert.equal(retries[0], address.port);
    assert.equal(await (await fetch(`http://127.0.0.1:${port}`)).text(), 'ok');
  } finally { server.closeAllConnections(); await new Promise<void>(r => server.close(() => r())); await new Promise<void>(r => occupied.close(() => r())); }
});

test('porta explícita: falha tratável, sem erro não capturado nem troca silenciosa', async () => {
  const occupied = http.createServer(); occupied.listen(0, '127.0.0.1'); await once(occupied, 'listening');
  const address = occupied.address(); assert.ok(address && typeof address !== 'string');
  try { await assert.rejects(listenLocal(http.createServer(), address.port, 1), { code: 'EADDRINUSE' }); }
  finally { await new Promise<void>(r => occupied.close(() => r())); }
});
