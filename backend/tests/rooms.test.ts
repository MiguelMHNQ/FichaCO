import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { RoomService } from '../domain/rooms.js';
import { MemoryRooms } from '../adapters/memory-rooms.js';
import { AppError } from '../domain/errors.js';
import type { Principal } from '../domain/models.js';

const person = (displayName: string): Principal => ({ id: randomUUID(), displayName });
const errorCode = (expected: string) => (error: unknown) => error instanceof AppError && error.code === expected;
const setup = () => ({ rooms: new RoomService(new MemoryRooms()), owner: person('Dono'), player: person('Jogador'), other: person('Outro') });

test('sala privada: código, hash com salt, senha obrigatória e DTO sem segredos', async () => {
  const repository = new MemoryRooms(), rooms = new RoomService(repository), owner = person('Dono'), guest = person('Convidado');
  const room = await rooms.create(owner, { visibility: 'private', maxPlayers: 4, password: 'segredo123' });
  assert.match(room.code, /^\d{6}$/); assert.equal(room.members[0]?.role, 'owner');
  assert.equal(JSON.stringify(room).includes('password'), false);
  assert.equal((await rooms.list(guest)).length, 0);
  assert.equal((await rooms.find(guest, room.code)).visibility, 'private');
  await assert.rejects(rooms.join(guest, room.code, { password: 'errada' }), errorCode('WRONG_PASSWORD'));
  const joined = await rooms.join(guest, room.code, { password: 'segredo123' });
  assert.equal(joined.players, 2);
  const stored = await repository.transaction(async tx => tx.get(room.code));
  assert.ok(stored?.password?.salt); assert.notEqual(stored?.password?.hash, 'segredo123');
});

test('entrada concorrente respeita a última vaga; reentrada não duplica participante', async () => {
  const { rooms, owner, player, other } = setup();
  const room = await rooms.create(owner, { visibility: 'public', maxPlayers: 2 });
  const results = await Promise.allSettled([rooms.join(player, room.code, {}), rooms.join(other, room.code, {})]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  const vencedor = results[0]?.status === 'fulfilled' ? player : other;
  assert.equal((await rooms.join(vencedor, room.code, {})).players, 2);
  assert.equal((await rooms.get(owner, room.code)).players, 2);
});

test('jogador altera o próprio nome/cor, mas não configura sala nem se promove', async () => {
  const { rooms, owner, player } = setup(); const room = await rooms.create(owner, { visibility: 'public', maxPlayers: 4 });
  await rooms.join(player, room.code, {});
  const renamed = await rooms.updateMember(player, room.code, player.id, { name: 'Novo nome', color: '#AABBCC' });
  assert.equal(renamed.members.find(m => m.userId === player.id)?.color, '#aabbcc');
  await assert.rejects(rooms.configure(player, room.code, { maxPlayers: 5 }), errorCode('FORBIDDEN'));
  await assert.rejects(rooms.updateMember(player, room.code, player.id, { role: 'moderator' }), errorCode('OWNER_ONLY'));
  await assert.rejects(rooms.updateMember(player, room.code, owner.id, { name: 'Inválido' }), errorCode('FORBIDDEN'));
});

test('moderador administra jogadores e configurações, mas dono é protegido', async () => {
  const { rooms, owner, player, other } = setup(); const room = await rooms.create(owner, { visibility: 'public', maxPlayers: 4 });
  await rooms.join(player, room.code, {}); await rooms.join(other, room.code, {});
  await rooms.updateMember(owner, room.code, player.id, { role: 'moderator' });
  assert.equal((await rooms.configure(player, room.code, { maxPlayers: 5 })).maxPlayers, 5);
  await assert.rejects(rooms.removeMember(player, room.code, owner.id, true), errorCode('OWNER_PROTECTED'));
  await assert.rejects(rooms.removeMember(player, room.code, owner.id, false), errorCode('OWNER_PROTECTED'));
  await assert.rejects(rooms.updateMember(player, room.code, owner.id, { name: 'Outro dono' }), errorCode('OWNER_PROTECTED'));
  await assert.rejects(rooms.updateMember(player, room.code, other.id, { role: 'moderator' }), errorCode('OWNER_ONLY'));
  await rooms.removeMember(player, room.code, other.id, false);
  assert.equal((await rooms.get(owner, room.code)).players, 2);
});

test('banimento vale para a identidade, mesmo trocando nome; expulsão permite reentrada', async () => {
  const { rooms, owner, player, other } = setup(); const room = await rooms.create(owner, { visibility: 'public', maxPlayers: 4 });
  await rooms.join(player, room.code, {}); await rooms.join(other, room.code, {});
  await rooms.removeMember(owner, room.code, player.id, true);
  await assert.rejects(rooms.join({ ...player, displayName: 'Disfarce' }, room.code, {}), errorCode('BANNED'));
  await assert.rejects(rooms.get(player, room.code), errorCode('NOT_A_MEMBER'));
  await rooms.removeMember(owner, room.code, other.id, false);
  assert.equal((await rooms.join(other, room.code, {})).players, 2);
});

test('configuração inválida não grava alteração parcial; troca de senha revoga a antiga', async () => {
  const { rooms, owner, player } = setup(); const room = await rooms.create(owner, { visibility: 'public', maxPlayers: 3 });
  await rooms.join(player, room.code, {});
  await assert.rejects(rooms.configure(owner, room.code, { visibility: 'private', password: 'nova', maxPlayers: 1 }), errorCode('CAPACITY_TOO_SMALL'));
  assert.equal((await rooms.get(owner, room.code)).visibility, 'public');
  await rooms.configure(owner, room.code, { visibility: 'private', password: 'nova' });
  await rooms.configure(owner, room.code, { password: 'outra' });
  await assert.rejects(rooms.join(person('Terceiro'), room.code, { password: 'nova' }), errorCode('WRONG_PASSWORD'));
});

test('senha até 10 caracteres, nomes seguros e campos de privilégios não aceitos', async () => {
  const { rooms, owner, player } = setup();
  await assert.rejects(rooms.create(owner, { visibility: 'private', maxPlayers: 4, password: '12345678901' }), errorCode('INVALID_PASSWORD'));
  await assert.rejects(rooms.create(owner, { visibility: 'private', maxPlayers: 4, password: '' }), errorCode('INVALID_PASSWORD'));
  await assert.rejects(rooms.create(owner, { visibility: 'public', maxPlayers: 4, name: '<script>' }), errorCode('INVALID_NAME'));
  const room = await rooms.create(owner, { visibility: 'public', maxPlayers: 4 });
  await assert.rejects(rooms.join(player, room.code, { role: 'owner' }), errorCode('UNKNOWN_FIELD'));
  await assert.rejects(rooms.find(player, '123'), errorCode('INVALID_CODE'));
});

test('limite de tentativas bloqueia entrada repetitiva sem alterar a sala', async () => {
  const { rooms, owner, player } = setup(); const room = await rooms.create(owner, { visibility: 'private', maxPlayers: 4, password: 'correta' });
  for (let n = 0; n < 10; n++) await assert.rejects(rooms.join(player, room.code, { password: 'errada' }), errorCode('WRONG_PASSWORD'));
  await assert.rejects(rooms.join(player, room.code, { password: 'correta' }), errorCode('RATE_LIMITED'));
  assert.equal((await rooms.get(owner, room.code)).players, 1);
});

test('não reutiliza código existente e a saída explícita do dono encerra a sala', async () => {
  const rooms = new RoomService(new MemoryRooms(), Date.now, () => '012345'), owner = person('Dono');
  const room = await rooms.create(owner, { visibility: 'public', maxPlayers: 4 });
  await assert.rejects(rooms.create(person('Outro'), { visibility: 'public', maxPlayers: 4 }), errorCode('CODE_UNAVAILABLE'));
  assert.deepEqual(await rooms.leave(owner, room.code), { closed: true });
  await assert.rejects(rooms.join(person('Tarde'), room.code, {}), errorCode('ROOM_NOT_FOUND'));
});

test('mesmo dono tem uma única sala ativa mesmo com criação concorrente; encerrar libera a próxima',async()=>{
 const rooms=new RoomService(new MemoryRooms()),owner=person('Dono');
 const [a,b]=await Promise.all([rooms.create(owner,{visibility:'public',maxPlayers:2}),rooms.create(owner,{visibility:'public',maxPlayers:8})]);assert.equal(a.code,b.code);assert.equal((await rooms.list(owner)).length,1);
 await rooms.leave(owner,a.code);const next=await rooms.create(owner,{visibility:'public',maxPlayers:2});assert.notEqual(next.code,a.code);
});
