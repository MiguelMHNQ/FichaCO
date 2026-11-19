import type { ServerResponse } from 'node:http';

// Navegadores precisam de byte ranges para restaurar a posição de áudio sem baixar a faixa inteira.
export function sendStaticContent(response: ServerResponse, contents: Buffer, type: string, method: string, range?: string): void {
  response.setHeader('Content-Type',type); response.setHeader('X-Content-Type-Options','nosniff'); response.setHeader('Accept-Ranges','bytes');
  if (method === 'HEAD' || !range) { response.setHeader('Content-Length',contents.length); response.end(method === 'HEAD' ? undefined : contents); return; }
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  let start = 0, end = contents.length - 1;
  if (match && (match[1] || match[2])) {
    if (!match[1]) start = Math.max(0,contents.length - Number(match[2]));
    else { start=Number(match[1]); if(match[2]) end=Math.min(Number(match[2]),end); }
  }
  if (!match || !match[1] && !match[2] || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start>end || start>=contents.length || !match[1] && Number(match[2])<=0) {
    response.statusCode=416; response.setHeader('Content-Range',`bytes */${contents.length}`); response.end(); return;
  }
  response.statusCode=206; response.setHeader('Content-Range',`bytes ${start}-${end}/${contents.length}`); response.setHeader('Content-Length',end-start+1);
  response.end(contents.subarray(start,end+1));
}
