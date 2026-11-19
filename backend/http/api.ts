import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { AppError, requireCondition } from '../domain/errors.js';
import { RoomService, productionUnavailable } from '../domain/rooms.js';
import { object, fields, name } from '../domain/validation.js';
import type { Principal } from '../domain/models.js';
import type { CharacterService } from '../domain/characters.js';
import type { TabletopService } from '../domain/tabletop.js';
import type { CharacterReference } from '../domain/models.js';

export interface ApiOptions {
  mode?: 'supabase';
  publicAuth?: { url: string; publishableKey: string };
  characters?: CharacterService;
  limitCharacters?: (user: Principal, write: boolean) => Promise<void>;
  rooms?: RoomService;
  tabletop?: TabletopService;
  authenticate?: (request: IncomingMessage) => Promise<Principal>;
  createDevIdentity?: (name: string) => { token: string; user: Principal; expiresAt: number };
  limitRequest?: (request:IncomingMessage,user?:Principal)=>Promise<void>;
  reserveUpload?: (user:Principal,code:string,input:unknown)=>Promise<{path:string}>;
}
async function body(request: IncomingMessage, limit = 16_384): Promise<unknown> {
  requireCondition(request.headers['content-type']?.split(';')[0]?.trim() === 'application/json', 415, 'JSON_REQUIRED', 'Use Content-Type: application/json.');
  // Vercel pode entregar um corpo já interpretado.
  const preParsed = (request as IncomingMessage & { body?: unknown }).body;
  if (preParsed !== undefined) {
    requireCondition(Buffer.byteLength(JSON.stringify(preParsed)) <= limit, 413, 'BODY_TOO_LARGE', 'Requisição muito grande.');
    return preParsed;
  }
  const chunks: Buffer[] = []; let size = 0;
  for await (const chunk of request) {
    const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string);
    size += data.length;
    requireCondition(size <= limit, 413, 'BODY_TOO_LARGE', 'Requisição muito grande.'); chunks.push(data);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') as unknown; }
  catch { throw new AppError(400, 'INVALID_JSON', 'JSON inválido.'); }
}
export function createApi(options: ApiOptions = {}) {
  return async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    const requestId = randomUUID();
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store'); response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Request-Id', requestId);
    const send = (status: number, data: unknown) => { response.statusCode = status; response.end(JSON.stringify(data)); };
    try {
      const url = new URL(request.url ?? '/', 'http://localhost');
      const path = url.pathname.replace(/\/$/, ''); const method = request.method ?? 'GET';
      if (request.headers.origin) {
        let origin: URL; try { origin = new URL(request.headers.origin); } catch { throw new AppError(403, 'INVALID_ORIGIN', 'Origem não permitida.'); }
        requireCondition(['http:', 'https:'].includes(origin.protocol) && origin.host === request.headers.host, 403, 'INVALID_ORIGIN', 'Origem não permitida.');
      }
      if (method === 'GET' && path === '/api/health') {
        send(200, { status: 'ok', configured: !!options.rooms && !!options.authenticate, mode: options.mode ?? (options.createDevIdentity ? 'development-memory' : 'unconfigured') }); return;
      }
      if (method === 'GET' && path === '/api/auth/config') {
        send(200, options.publicAuth ? { enabled: true, ...options.publicAuth } : { enabled: false }); return;
      }
      if (path === '/api/dev/identities') {
        requireCondition(options.createDevIdentity && method === 'POST', 404, 'NOT_FOUND', 'Rota não encontrada.');
        const data = object(await body(request)); fields(data, ['name']);
        send(201, { ...options.createDevIdentity(name(data.name)), development: true }); return;
      }
      if (!options.rooms || !options.authenticate) productionUnavailable();
      await options.limitRequest?.(request);
      const user = await options.authenticate(request);
      await options.limitRequest?.(request,user);
      const upload=path.match(/^\/api\/rooms\/(\d{6})\/uploads$/);
      if(upload?.[1]&&method==='POST'){requireCondition(options.reserveUpload,503,'UPLOADS_UNAVAILABLE','Uploads indisponíveis.');send(201,await options.reserveUpload(user,upload[1],await body(request)));return;}
      if (path === '/api/me' && method === 'GET') { send(200, { id: user.id, displayName: user.displayName }); return; }
      if (path === '/api/characters' || path.startsWith('/api/characters/')) {
        requireCondition(options.characters, 503, 'CHARACTERS_NOT_CONFIGURED', 'Armazenamento de fichas indisponível.');
        await options.limitCharacters?.(user, method !== 'GET');
        const characters = options.characters;
        if (path === '/api/characters' && method === 'GET') { send(200, await characters.list(user)); return; }
        if (path === '/api/characters' && method === 'POST') { send(201, await characters.create(user, await body(request, 1_048_576))); return; }
        const character = path.match(/^\/api\/characters\/([^/]+)(\/portrait)?$/);
        if (character?.[1]) {
          const id = character[1];
          if (method === 'GET') {
            const record = await characters.get(user, id);
            send(200, character[2] ? { foto: record.document.foto } : record); return;
          }
          if (!character[2] && method === 'PUT') { send(200, await characters.update(user, id, await body(request, 1_048_576))); return; }
          if (!character[2] && method === 'DELETE') { send(200, await characters.remove(user, id, await body(request))); return; }
        }
        throw new AppError(404, 'NOT_FOUND', 'Rota não encontrada.');
      }
      const rooms = options.rooms;
      async function roomInput() {
        const data=object(await body(request));const {characterId,...input}=data;let character:CharacterReference|undefined;
        if(characterId!==undefined&&characterId!==null&&characterId!==''){
          requireCondition(options.characters&&typeof characterId==='string',400,'INVALID_CHARACTER','Escolha uma ficha da sua conta.');
          const record=await options.characters.get(user,characterId);
          character={id:record.document.id,name:record.document.nomePersonagem,class:record.document.classe,level:record.document.nivel};
        }
        return {input,character};
      }
      const tabletop=path.match(/^\/api\/rooms\/(\d{6})\/tabletop$/);
      if(tabletop?.[1]){
        requireCondition(options.tabletop,503,'TABLETOP_NOT_CONFIGURED','Sincronização indisponível.');
        if(method==='GET'){const raw=url.searchParams.get('since');const since=raw&&/^\d+$/.test(raw)?Number(raw):undefined;send(200,await options.tabletop.get(user,tabletop[1],since));return;}
        if(method==='POST'){send(200,await options.tabletop.apply(user,tabletop[1],await body(request,3_145_728),options.characters?async id=>{const record=await options.characters!.get(user,id);return {id:record.document.id,name:record.document.nomePersonagem};}:undefined));return;}
      }
      if (path === '/api/rooms') {
        if (method === 'GET') { send(200, await rooms.list(user)); return; }
        if (method === 'POST') {const data=await roomInput();send(201, await rooms.create(user,data.input,data.character)); return; }
      }
      const match = path.match(/^\/api\/rooms\/([^/]+)(?:\/(lookup|join|leave|members)(?:\/([^/]+)(?:\/(kick|ban))?)?)?$/);
      if (match) {
        const [, code, action, target, moderation] = match;
        requireCondition(code, 400, 'INVALID_CODE', 'Código inválido.');
        if (!action && method === 'GET') { send(200, await rooms.get(user, code)); return; }
        if (!action && method === 'PATCH') { send(200, await rooms.configure(user, code, await body(request))); return; }
        if (action === 'lookup' && !target && method === 'GET') { send(200, await rooms.find(user, code)); return; }
        if (action === 'join' && !target && method === 'POST') {const data=await roomInput();send(200, await rooms.join(user,code,data.input,data.character)); return; }
        if (action === 'leave' && !target && method === 'POST') {
          fields(object(await body(request)), []); send(200, await rooms.leave(user, code)); return;
        }
        if (action === 'members' && target) {
          if (!moderation && method === 'PATCH') { send(200, await rooms.updateMember(user, code, target, await body(request))); return; }
          if (moderation && method === 'POST') { fields(object(await body(request)), []); send(200, await rooms.removeMember(user, code, target, moderation === 'ban')); return; }
        }
      }
      throw new AppError(404, 'NOT_FOUND', 'Rota não encontrada.');
    } catch (error) {
      if (error instanceof AppError) {
        if (error.status === 429) response.setHeader('Retry-After', '60');
        send(error.status, { error: { code: error.code, message: error.message }, requestId });
      } else {
        // Não registrar corpo, senha ou token em logs.
        console.error('Falha interna na API', requestId);
        send(500, { error: { code: 'INTERNAL_ERROR', message: 'Não foi possível concluir a operação.' }, requestId });
      }
    }
  };
}
