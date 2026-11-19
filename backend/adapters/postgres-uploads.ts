import type { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import type { Principal } from '../domain/models.js';
import { roomCode, object, fields } from '../domain/validation.js';
import { AppError, requireCondition } from '../domain/errors.js';
const extensions:Record<string,string>={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif','audio/mpeg':'mp3','audio/ogg':'ogg','audio/wav':'wav','audio/x-wav':'wav','audio/mp4':'m4a','audio/webm':'webm','video/mp4':'mp4','video/webm':'webm'};
export class PostgresUploads {
  constructor(private readonly pool:Pool){}
  async reserve(user:Principal,code:string,input:unknown){
    roomCode(code);const d=object(input);fields(d,['size','mime']);
    requireCondition(typeof d.size==='number'&&Number.isSafeInteger(d.size)&&d.size>0&&d.size<=52428800&&typeof d.mime==='string'&&Object.hasOwn(extensions,d.mime),400,'INVALID_UPLOAD','Envie um arquivo permitido de até 50 MB.');
    requireCondition(d.mime!=='image/gif'||d.size<=10*1024*1024,400,'INVALID_UPLOAD','GIF: máximo de 10 MB.');
    requireCondition(!d.mime.startsWith('video/')||d.size<=40*1024*1024,400,'INVALID_UPLOAD','Vídeo: máximo de 40 MB.');
    const path=code+'/'+randomUUID()+'.'+extensions[d.mime];
    try{await this.pool.query('SELECT private.reserve_tabletop_upload($1,$2,$3,$4,$5)',[user.id,code,path,d.size,d.mime]);}
    catch(error){const code=(error as {code?:string}).code;if(code==='P0001')throw new AppError(409,'UPLOAD_QUOTA','Limite de uploads atingido ou sessão indisponível.');throw error;}
    return {path};
  }
}
