export type Role = 'owner' | 'moderator' | 'player';
export type Visibility = 'public' | 'private';
export interface Principal { id: string; displayName: string }
export interface CharacterReference { id: string; name: string; class: string; level: number }
export interface Member { userId: string; name: string; role: Role; color: string; joinedAt: number; character?: CharacterReference }
export interface PasswordHash { salt: string; hash: string }
export interface Room {
  code: string;
  ownerId: string;
  visibility: Visibility;
  maxPlayers: number;
  password: PasswordHash | null;
  members: Member[];
  bannedUserIds: string[];
  createdAt: number;
  updatedAt: number;
  version: number;
  closed: boolean;
  liveKey?: string;
  tabletop?: import('./tabletop.js').TabletopDocument;
}
export interface RoomSummary {
  code: string; ownerName: string; visibility: Visibility; maxPlayers: number; players: number;
}
export interface RoomView extends RoomSummary {
  members: Member[]; version: number; createdAt: number;
}
// A implementação definitiva precisa garantir transação atômica no banco.
export interface RoomTransaction {
  get(code: string): Promise<Room | undefined>;
  put(room: Room): Promise<void>;
  list(): Promise<Room[]>;
}
export interface RoomRepository {
  transaction<T>(operation: (tx: RoomTransaction) => Promise<T>, code?: string): Promise<T>;
}
