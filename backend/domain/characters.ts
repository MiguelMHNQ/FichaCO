import { AppError, requireCondition } from './errors.js';
import type { Principal } from './models.js';
import { fields, object } from './validation.js';

export interface CharacterDocument {
  id: string; nomePersonagem: string; classe: string; nivel: number; foto: string; desc: string;
  dados: Record<string, unknown>; estadoCompleto: Record<string, unknown>;
}
export interface CharacterRecord { document: CharacterDocument; version: number; updatedAt: number }
export interface CharacterSummary {
  id: string; nomePersonagem: string; classe: string; nivel: number; desc: string;
  hasPhoto: boolean; version: number; updatedAt: number;
}
export interface CharacterRepository {
  list(owner: string): Promise<CharacterSummary[]>;
  get(owner: string, id: string): Promise<CharacterRecord | undefined>;
  create(owner: string, document: CharacterDocument, mutation: string, importKey: string | null): Promise<CharacterRecord>;
  update(owner: string, document: CharacterDocument, version: number, mutation: string): Promise<CharacterRecord>;
  remove(owner: string, id: string, version: number, mutation: string): Promise<void>;
}
export function uuid(value: unknown): string {
  requireCondition(typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value), 400, 'INVALID_ID', 'Identificador inválido.');
  return value.toLowerCase();
}
function revision(value: unknown): number {
  requireCondition(typeof value === 'number' && Number.isSafeInteger(value) && value > 0, 400, 'INVALID_VERSION', 'Informe a revisão da ficha.'); return value;
}
function text(value: unknown, max: number, empty = false): string {
  requireCondition(typeof value === 'string' && value.length <= max && (empty || value.trim().length > 0), 400, 'INVALID_CHARACTER', 'Campos da ficha inválidos.'); return value;
}
function safeTree(value: unknown, depth = 0): void {
  requireCondition(depth <= 30, 400, 'INVALID_CHARACTER', 'Ficha muito complexa.');
  if (!value || typeof value !== 'object') return;
  for (const [key, item] of Object.entries(value)) {
    requireCondition(!['__proto__', 'prototype', 'constructor'].includes(key), 400, 'INVALID_CHARACTER', 'Campo inválido na ficha.');
    safeTree(item, depth + 1);
  }
}
function portrait(value: unknown): string {
  const data = text(value ?? '', 700_000, true); if (!data) return '';
  const match = /^data:image\/(png|jpeg|jpg|webp|gif);base64,([A-Za-z0-9+/]+={0,2})$/.exec(data);
  requireCondition(match?.[1] && match[2], 400, 'INVALID_PORTRAIT', 'Use uma foto PNG, JPEG, WebP ou GIF.');
  const bytes = Buffer.from(match[2], 'base64');
  const type = match[1];
  const valid = type === 'png' ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
    : type === 'webp' ? bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP'
    : type === 'gif' ? ['GIF87a','GIF89a'].includes(bytes.toString('ascii', 0, 6))
    : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  requireCondition(valid, 400, 'INVALID_PORTRAIT', 'O conteúdo da foto é inválido.'); return data;
}
const RESOURCE_KEYS = new Set(['fragmentados_pvmax','fragmentados_pemax','fragmentados_pv','fragmentados_pe','fragmentados_ca','fragmentados_ca_ajuste','fragmentados_xp','fragmentados_pce','fragmentados_pesomax','fragmentados_inventario','fragmentados_const_checks','fragmentados_anel_escama_cargas','fragmentados_anel_escama_ativo','fragmentados_puxa_corte_cargas','fragmentados_colar_cura_cargas','fragmentados_pedra_reflexao_cargas']);
function resources(value: unknown): Record<string, string> {
  const result: Record<string,string> = {};
  for (const [key, item] of Object.entries(object(value ?? {}))) {
    requireCondition(RESOURCE_KEYS.has(key) && (typeof item === 'string' || typeof item === 'number' && Number.isFinite(item) || typeof item === 'boolean') && String(item).length <= 300_000, 400, 'INVALID_RESOURCES', 'Recursos da ficha inválidos.');
    if(key==='fragmentados_inventario'){
      let items:unknown;try{items=JSON.parse(String(item));}catch{requireCondition(false,400,'INVALID_RESOURCES','Inventário inválido.');}
      requireCondition(Array.isArray(items)&&items.length<=1000,400,'INVALID_RESOURCES','Inventário inválido.');
      result[key]=JSON.stringify(items.map(raw=>{const row=object(raw);const nome=text(row.nome??'',200,true),qtd=Number(row.qtd??1),peso=Number(row.peso??0);requireCondition(Number.isFinite(qtd)&&qtd>=0&&qtd<=1e6&&Number.isFinite(peso)&&peso>=0&&peso<=1e6,400,'INVALID_RESOURCES','Quantidade ou peso inválidos.');return {nome,qtd,peso};}));
    }else if(key==='fragmentados_const_checks'){
      let parsed:unknown;try{parsed=JSON.parse(String(item));}catch{requireCondition(false,400,'INVALID_RESOURCES','Constâncias inválidas.');}
      const checks=object(parsed);requireCondition(Object.keys(checks).length<=100&&Object.values(checks).every(v=>typeof v==='number'&&Number.isInteger(v)&&v>=0&&v<=3),400,'INVALID_RESOURCES','Constâncias inválidas.');result[key]=JSON.stringify(checks);
    }else if(key!=='fragmentados_anel_escama_ativo'){
      requireCondition(Number.isFinite(Number(item))&&Math.abs(Number(item))<=1e12,400,'INVALID_RESOURCES','Recurso numérico inválido.');result[key]=String(item);
    }else result[key] = String(item);
  }
  return result;
}
export function characterDocument(input: unknown, owner: string): CharacterDocument {
  const data = object(input); fields(data, ['id','nomePersonagem','classe','nivel','foto','desc','dados','estadoCompleto']);
  requireCondition(Buffer.byteLength(JSON.stringify(data)) <= 850_000, 413, 'CHARACTER_TOO_LARGE', 'Ficha muito grande. Reduza a foto ou o conteúdo.');
  safeTree(data);
  const id = uuid(data.id), name = text(data.nomePersonagem, 80).trim().normalize('NFC'), classe = text(data.classe, 40).trim();
  requireCondition(!/[<>\p{Cc}\p{Cf}]/u.test(name + classe), 400, 'INVALID_CHARACTER', 'Nome ou classe inválidos.');
  requireCondition(typeof data.nivel === 'number' && Number.isInteger(data.nivel) && data.nivel >= 1 && data.nivel <= 100, 400, 'INVALID_CHARACTER', 'Nível inválido.');
  const state:Record<string,unknown> = { ...object(data.estadoCompleto), id, usuarioDono: owner, persistido: true, nomePersonagem: name, classe, nivel: data.nivel };
  for(const key of ['raca','caminho','arma','armadura','acessorio'] as const)if(state[key]!==undefined&&state[key]!==null){const value=text(state[key],100,true);requireCondition(!/[<>\p{Cc}\p{Cf}]/u.test(value),400,'INVALID_CHARACTER','Opção inválida na ficha.');}
  for(const key of ['constancias','racaEscolhas'])if(state[key]!==undefined){const values=object(state[key]);fields(values,['Vigor','Destreza','Sabedoria','Inteligência','Força','Carisma']);requireCondition(Object.values(values).every(v=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=1000000),400,'INVALID_CHARACTER','Atributos inválidos.');}
  for(const key of ['constanciasEscolhidas','talentos','truques','magiasGrimorio','artesDaEspada','caminhoEspada'])if(state[key]!==undefined){const list=state[key];requireCondition(Array.isArray(list)&&list.length<=300&&list.every(v=>typeof v==='string'&&v.length<=200&&!/[<>\p{Cc}\p{Cf}]/u.test(v)),400,'INVALID_CHARACTER','Lista de habilidades inválida.');}
  if(state.ganhosNivel!==undefined)for(const gain of Object.values(object(state.ganhosNivel))){const g=object(gain);for(const key of ['pv','pe','dado','rolado','vigor'])if(g[key]!==undefined)requireCondition(typeof g[key]==='number'&&Number.isFinite(g[key])&&Math.abs(g[key])<=1e6,400,'INVALID_CHARACTER','Histórico de níveis inválido.');}
  delete (state as Record<string, unknown>).revisaoNuvem;
  return { id, nomePersonagem: name, classe, nivel: data.nivel, foto: portrait(data.foto), desc: text(data.desc ?? '', 10_000, true), dados: resources(data.dados), estadoCompleto: state };
}
export class CharacterService {
  constructor(private readonly repository: CharacterRepository) {}
  list(actor: Principal) { return this.repository.list(actor.id); }
  async get(actor: Principal, id: string) {
    const record = await this.repository.get(actor.id, uuid(id));
    if (!record) throw new AppError(404, 'CHARACTER_NOT_FOUND', 'Ficha não encontrada.'); return record;
  }
  async create(actor: Principal, input: unknown) {
    const data = object(input); fields(data, ['document','mutationId','importKey']);
    const importKey = data.importKey ?? null;
    requireCondition(importKey === null || typeof importKey === 'string' && /^[a-f0-9]{64}$/.test(importKey), 400, 'INVALID_IMPORT', 'Identificador da importação inválido.');
    return this.repository.create(actor.id, characterDocument(data.document, actor.id), uuid(data.mutationId), importKey);
  }
  async update(actor: Principal, id: string, input: unknown) {
    const data = object(input); fields(data, ['document','expectedVersion','mutationId']);
    const document = characterDocument(data.document, actor.id);
    requireCondition(document.id === uuid(id), 400, 'INVALID_ID', 'Identificadores da ficha não correspondem.');
    return this.repository.update(actor.id, document, revision(data.expectedVersion), uuid(data.mutationId));
  }
  async remove(actor: Principal, id: string, input: unknown) {
    const data = object(input); fields(data, ['expectedVersion','mutationId']);
    await this.repository.remove(actor.id, uuid(id), revision(data.expectedVersion), uuid(data.mutationId)); return { deleted: true };
  }
}
