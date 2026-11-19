import { randomInt, randomBytes } from 'node:crypto';
import { requireCondition, AppError } from './errors.js';
import type { Member, Principal, Room, RoomRepository, RoomSummary, RoomView, CharacterReference } from './models.js';
import * as validate from './validation.js';
import { hashPassword, verifyPassword } from '../security/password.js';
import { RateLimiter, type AttemptLimiter } from '../security/rate-limit.js';

const summary = (room: Room): RoomSummary => ({
  code: room.code, ownerName: room.members.find(m => m.userId === room.ownerId)?.name ?? 'Dono',
  visibility: room.visibility, maxPlayers: room.maxPlayers, players: room.members.length
});
export const view = (room: Room): RoomView => ({ ...summary(room), members: room.members.map(m => ({ ...m })), version: room.version, createdAt: room.createdAt });
export function open(room: Room | undefined): asserts room is Room {
  requireCondition(room && !room.closed, 404, 'ROOM_NOT_FOUND', 'Sessão não encontrada.');
}
export function member(room: Room, actor: Principal): Member {
  const result = room.members.find(m => m.userId === actor.id);
  requireCondition(result, 403, 'NOT_A_MEMBER', 'Você não participa desta sessão.');
  return result;
}
export function manager(room: Room, actor: Principal): Member {
  const result = member(room, actor);
  requireCondition(result.role !== 'player', 403, 'FORBIDDEN', 'Esta ação exige dono ou moderador.');
  return result;
}
export function changed(room: Room, now: number): void { room.version++; room.updatedAt = now; }

export class RoomService {
  private readonly limiter: AttemptLimiter;
  constructor(private readonly repository: RoomRepository, private readonly now = Date.now, private readonly generateCode = () => String(randomInt(0, 1_000_000)).padStart(6, '0'), limiter?: AttemptLimiter) {
    this.limiter = limiter ?? new RateLimiter(now);
  }
  async create(actor: Principal, input: unknown, character?: CharacterReference): Promise<RoomView> {
    await this.limiter.check(`create:${actor.id}`, 5);
    const data = validate.object(input); validate.fields(data, ['visibility', 'maxPlayers', 'password', 'name', 'color']);
    const visibility = validate.visibility(data.visibility);
    const maxPlayers = validate.capacity(data.maxPlayers);
    const name = validate.name(data.name ?? actor.displayName);
    const color = validate.color(data.color ?? '#c9a84c');
    const password = visibility === 'private' ? await hashPassword(validate.password(data.password)) : null;
    requireCondition(visibility === 'private' || data.password === undefined || data.password === '', 400, 'PUBLIC_PASSWORD', 'Sala pública não usa senha.');
    return this.repository.transaction(async tx => {
      const active=(await tx.list()).find(room=>room.ownerId===actor.id&&!room.closed);
      if(active)return view(active);
      let code = '';
      for (let n = 0; n < 30; n++) { const candidate = validate.roomCode(this.generateCode()); if (!await tx.get(candidate)) { code = candidate; break; } }
      requireCondition(code, 503, 'CODE_UNAVAILABLE', 'Não foi possível gerar um código. Tente novamente.');
      const timestamp = this.now();
      const room: Room = { code, ownerId: actor.id, visibility, maxPlayers, password, members: [{ userId: actor.id, name, color, role: 'owner', joinedAt: timestamp }], bannedUserIds: [], createdAt: timestamp, updatedAt: timestamp, version: 1, closed: false };
      room.liveKey=randomBytes(32).toString('base64url');
      if (character && room.members[0]) room.members[0].character = character;
      await tx.put(room); return view(room);
    });
  }
  async list(actor: Principal): Promise<RoomSummary[]> {
    await this.limiter.check(`list:${actor.id}`, 60);
    return this.repository.transaction(async tx => (await tx.list()).filter(r => !r.closed && r.visibility === 'public' && !r.bannedUserIds.includes(actor.id)).map(summary));
  }
  async get(actor: Principal, code: string): Promise<RoomView> {
    await this.limiter.check(`room-operations:${actor.id}`,120);
    validate.roomCode(code);
    return this.repository.transaction(async tx => { const room = await tx.get(code); open(room); member(room, actor); return view(room); }, code);
  }
  async find(actor: Principal, code: string): Promise<RoomSummary> {
    validate.roomCode(code); await this.limiter.check(`find:${actor.id}`, 20);
    return this.repository.transaction(async tx => { const room = await tx.get(code); open(room); requireCondition(!room.bannedUserIds.includes(actor.id), 403, 'BANNED', 'Você foi banido desta sessão.'); return summary(room); }, code);
  }
  async join(actor: Principal, code: string, input: unknown, character?: CharacterReference): Promise<RoomView> {
    validate.roomCode(code); await this.limiter.check(`join:${actor.id}`, 10);
    const data = validate.object(input); validate.fields(data, ['password', 'name', 'color']);
    const name = validate.name(data.name ?? actor.displayName), color = validate.color(data.color ?? '#80b8ef');
    return this.repository.transaction(async tx => {
      const room = await tx.get(code); open(room);
      requireCondition(!room.bannedUserIds.includes(actor.id), 403, 'BANNED', 'Você foi banido desta sessão.');
      // Reentrar não consome outra vaga nem permite promover o próprio papel.
      const existing = room.members.find(m => m.userId === actor.id);
      if (existing) { if (character) { existing.character = character; changed(room, this.now()); await tx.put(room); } return view(room); }
      if (room.visibility === 'private') {
        const senha = validate.password(data.password);
        requireCondition(room.password && await verifyPassword(senha, room.password), 403, 'WRONG_PASSWORD', 'Senha da sessão incorreta.');
      }
      requireCondition(room.members.length < room.maxPlayers, 409, 'ROOM_FULL', 'Esta sessão está cheia.');
      room.members.push({ userId: actor.id, name, color, role: 'player', joinedAt: this.now(), ...(character ? { character } : {}) }); room.liveKey=randomBytes(32).toString('base64url');changed(room, this.now()); await tx.put(room); return view(room);
    }, code);
  }
  async configure(actor: Principal, code: string, input: unknown): Promise<RoomView> {
    await this.limiter.check(`room-operations:${actor.id}`,120);
    validate.roomCode(code); const data = validate.object(input); validate.fields(data, ['visibility', 'password', 'maxPlayers']);
    requireCondition(Object.keys(data).length, 400, 'EMPTY_PATCH', 'Informe o que deseja alterar.');
    return this.repository.transaction(async tx => {
      const room = await tx.get(code); open(room); manager(room, actor);
      const visibility = data.visibility === undefined ? room.visibility : validate.visibility(data.visibility);
      const max = data.maxPlayers === undefined ? room.maxPlayers : validate.capacity(data.maxPlayers);
      requireCondition(max >= room.members.length, 409, 'CAPACITY_TOO_SMALL', 'O limite não pode ser menor que a quantidade atual de participantes.');
      if (visibility === 'private' && (data.password !== undefined || room.password === null)) room.password = await hashPassword(validate.password(data.password));
      if (visibility === 'public') { requireCondition(data.password === undefined || data.password === '', 400, 'PUBLIC_PASSWORD', 'Sala pública não usa senha.'); room.password = null; }
      room.visibility = visibility; room.maxPlayers = max; changed(room, this.now()); await tx.put(room); return view(room);
    }, code);
  }
  async updateMember(actor: Principal, code: string, targetId: string, input: unknown): Promise<RoomView> {
    await this.limiter.check(`room-operations:${actor.id}`,120);
    validate.roomCode(code); const data = validate.object(input); validate.fields(data, ['name', 'color', 'role']);
    requireCondition(Object.keys(data).length, 400, 'EMPTY_PATCH', 'Informe o que deseja alterar.');
    return this.repository.transaction(async tx => {
      const room = await tx.get(code); open(room); const caller = member(room, actor);
      const target = room.members.find(m => m.userId === targetId);
      requireCondition(target, 404, 'MEMBER_NOT_FOUND', 'Participante não encontrado.');
      if (targetId !== actor.id) {
        manager(room, actor);
        requireCondition(target.role !== 'owner', 403, 'OWNER_PROTECTED', 'Somente o dono pode alterar os próprios dados.');
      }
      if (data.role !== undefined) {
        requireCondition(caller.role === 'owner' && target.role !== 'owner', 403, 'OWNER_ONLY', 'Somente o dono pode nomear ou remover moderadores.');
        requireCondition(data.role === 'moderator' || data.role === 'player', 400, 'INVALID_ROLE', 'Escolha jogador ou moderador.');
        target.role = data.role;
        room.liveKey=randomBytes(32).toString('base64url');
      }
      if (data.name !== undefined) target.name = validate.name(data.name);
      if (data.color !== undefined) target.color = validate.color(data.color);
      changed(room, this.now()); await tx.put(room); return view(room);
    }, code);
  }
  async removeMember(actor: Principal, code: string, targetId: string, ban: boolean): Promise<RoomView> {
    await this.limiter.check(`room-operations:${actor.id}`,120);
    validate.roomCode(code);
    return this.repository.transaction(async tx => {
      const room = await tx.get(code); open(room); manager(room, actor);
      const target = room.members.find(m => m.userId === targetId);
      requireCondition(target, 404, 'MEMBER_NOT_FOUND', 'Participante não encontrado.');
      requireCondition(target.role !== 'owner', 403, 'OWNER_PROTECTED', 'O dono não pode ser expulso ou banido.');
      room.members = room.members.filter(m => m.userId !== targetId);
      room.liveKey=randomBytes(32).toString('base64url');
      if (ban && !room.bannedUserIds.includes(targetId)) room.bannedUserIds.push(targetId);
      changed(room, this.now()); await tx.put(room); return view(room);
    }, code);
  }
  async leave(actor: Principal, code: string): Promise<{ closed: boolean }> {
    await this.limiter.check(`room-operations:${actor.id}`,120);
    validate.roomCode(code);
    return this.repository.transaction(async tx => {
      const room = await tx.get(code); open(room); const caller = member(room, actor);
      if (caller.role === 'owner') { room.closed = true; room.members = [];room.password=null;room.bannedUserIds=[];delete room.tabletop; }
      else room.members = room.members.filter(m => m.userId !== actor.id);
      room.liveKey=randomBytes(32).toString('base64url');
      changed(room, this.now()); await tx.put(room); return { closed: room.closed };
    }, code);
  }
}

// Até existir um adaptador durável + autenticação real, a implantação não aceita dados.
export function productionUnavailable(): never {
  throw new AppError(503, 'BACKEND_NOT_CONFIGURED', 'Backend aguardando a integração com Supabase.');
}
