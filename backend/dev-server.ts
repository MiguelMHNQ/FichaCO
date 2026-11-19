import http from 'node:http';
import https from 'node:https';
import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApi } from './http/api.js';
import { MemoryRooms } from './adapters/memory-rooms.js';
import { DevAuth } from './adapters/dev-auth.js';
import { RoomService } from './domain/rooms.js';
import { listenLocal } from './http/listen-local.js';
import { configuredOptions } from './runtime.js';
import { sendStaticContent } from './http/static-content.js';
import { networkInterfaces } from 'node:os';
import { TabletopService } from './domain/tabletop.js';

if (process.env.VERCEL || process.env.NODE_ENV === 'production') throw new Error('O servidor de memória funciona somente em desenvolvimento local.');
// Arquivo compilado fica em .backend-build/backend; sobe até a raiz do projeto.
const siteRoot = fileURLToPath(new URL('../../', import.meta.url)).replace(/[\\/]$/, '');
let port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT inválida.');
const auth = new DevAuth();
const online = configuredOptions();
const lan=process.argv.includes('--lan');
if(lan&&!online)throw new Error('O modo LAN exige Supabase configurado; identidades de memória nunca são expostas à rede.');
if(lan&&(!process.env.LAN_TLS_CERT||!process.env.LAN_TLS_KEY))throw new Error('LAN exige HTTPS. Configure LAN_TLS_CERT e LAN_TLS_KEY com um certificado local confiável.');
const addresses=Object.values(networkInterfaces()).flat().filter(a=>a?.family==='IPv4'&&!a.internal&&/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(a.address)).map(a=>a!.address);
const memory=new MemoryRooms();
const api = createApi(online ?? { rooms: new RoomService(memory),tabletop:new TabletopService(memory), authenticate: req => auth.authenticate(req), createDevIdentity: nome => auth.create(nome) });
const types: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.mp3': 'audio/mpeg', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
const handler: http.RequestListener = async (req, res) => {
  // Impede uso de identidades de teste via DNS rebinding ou exposição acidental em LAN.
  if (!['127.0.0.1:' + port, 'localhost:' + port,...(lan?addresses.map(a=>a+':'+port):[])].includes(req.headers.host ?? '')) { res.writeHead(403).end(); return; }
  if (req.url?.startsWith('/api/')) { await api(req, res); return; }
  if (!['GET', 'HEAD'].includes(req.method ?? '')) { res.writeHead(405).end(); return; }
  try {
    const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
    if (pathname !== '/' && pathname !== '/index.html' && !/^\/(pages|scripts|styles|assets)\//.test(pathname)) { res.writeHead(404).end(); return; }
    const file = await realpath(path.join(siteRoot, pathname === '/' ? 'index.html' : pathname));
    const extension = path.extname(file).toLowerCase();
    if (!file.startsWith(siteRoot + path.sep) || !types[extension]) { res.writeHead(404).end(); return; }
    const contents = await readFile(file);
    sendStaticContent(res,contents,types[extension]!,req.method!,req.headers.range);
  } catch { res.writeHead(404).end(); }
};
const server=lan?https.createServer({cert:await readFile(process.env.LAN_TLS_CERT!),key:await readFile(process.env.LAN_TLS_KEY!)},handler):http.createServer(handler);
try {
  port = await listenLocal(server, port, process.env.PORT ? 1 : 10, occupied => console.log(`Porta ${occupied} ocupada; tentando a próxima…`),lan?'0.0.0.0':'127.0.0.1');
  console.log(`Primórdios: ${lan?'https':'http'}://127.0.0.1:${port}`);
  console.log(online ? 'Supabase: autenticação real, salas e TableTop persistentes.' : 'Desenvolvimento: API em memória; login da interface exige Supabase.');
  if(lan)for(const address of addresses)console.log(`LAN: https://${address}:${port} — autorize o retorno /pages/tela0.html no Supabase.`);
  const stop = () => {
    server.close(() => process.exit(0));
    server.closeIdleConnections();
    setTimeout(() => { server.closeAllConnections(); process.exit(0); }, 3000).unref();
  };
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
} catch (error) {
  const code = (error as NodeJS.ErrnoException).code;
  console.error(code === 'EADDRINUSE' ? `Porta ${port} ocupada. Encerre a outra instância ou escolha outra porta com PORT.` : 'Não foi possível iniciar o servidor local.');
  process.exitCode = 1;
}
