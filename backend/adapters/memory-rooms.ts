import type { Room, RoomRepository, RoomTransaction } from '../domain/models.js';
// Não usar em Vercel/produção: memória não é compartilhada entre instâncias.
export class MemoryRooms implements RoomRepository {
  private rooms = new Map<string, Room>();
  private tail: Promise<void> = Promise.resolve();
  async transaction<T>(operation: (tx: RoomTransaction) => Promise<T>): Promise<T> {
    const previous = this.tail;
    let release!: () => void;
    this.tail = new Promise<void>(resolve => { release = resolve; });
    await previous;
    try {
      const draft = structuredClone(this.rooms);
      const result = await operation({ get: async code => draft.get(code), put: async room => { draft.set(room.code, room); }, list: async () => [...draft.values()] });
      this.rooms = draft;
      return structuredClone(result);
    } finally { release(); }
  }
}
