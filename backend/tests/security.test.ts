import test from 'node:test';
import assert from 'node:assert/strict';
import type { IncomingMessage } from 'node:http';
import { requestLimits } from '../security/request-limit.js';
import { RateLimiter } from '../security/rate-limit.js';
const request=(ip:string,forwarded?:string)=>({method:'GET',headers:{'x-forwarded-for':forwarded},socket:{remoteAddress:ip}} as unknown as IncomingMessage);
test('limites de IP não confiam em cabeçalho externo fora da Vercel e não guardam IP em claro',async()=>{
 const seen:string[]=[];const gate=requestLimits({check:key=>{seen.push(key);}},false);
 await gate(request('127.0.0.1','1.2.3.4'));await gate(request('127.0.0.1','8.8.8.8'));assert.equal(seen[0],seen[1]);assert.ok(!seen[0]?.includes('127.0.0.1'));
 const hosted=requestLimits({check:key=>{seen.push(key);}},true);await hosted(request('127.0.0.1','1.2.3.4'));assert.notEqual(seen[0],seen[2]);
});
test('requisições excessivas são bloqueadas antes de consultar o provedor',async()=>{
 const gate=requestLimits(new RateLimiter(),false),req=request('127.0.0.1');for(let i=0;i<600;i++)await gate(req);await assert.rejects(gate(req),{code:'RATE_LIMITED'});
});
