import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import type { IncomingMessage } from 'node:http';
import type { Principal } from '../domain/models.js';
import { RateLimiter, type AttemptLimiter } from './rate-limit.js';

export function requestLimits(limiter: AttemptLimiter, vercel = process.env.VERCEL === '1') {
  const fast=new RateLimiter();
  return async (request: IncomingMessage, user?: Principal) => {
    if(user){await limiter.check(`api:${user.id}:${request.method==='GET'?'read':'write'}`,request.method==='GET'?300:240);return;}
    // Cabeçalhos encaminhados só são confiados dentro da infraestrutura Vercel.
    const forwarded=vercel?(request.headers['x-vercel-forwarded-for']??request.headers['x-forwarded-for']):undefined;
    const candidate=(typeof forwarded==='string'?forwarded.split(',')[0]?.trim():undefined)||request.socket.remoteAddress||'unknown';
    const ip=isIP(candidate)?candidate:'unknown';
    const hash=createHash('sha256').update(ip).digest('hex');
    fast.check(`ip:${hash}`,1200);
    await limiter.check(`ip:${hash}`,600);
  };
}
