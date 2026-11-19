import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApi } from '../backend/http/api.js';
import { configuredOptions } from '../backend/runtime.js';

const handle = createApi(configuredOptions());
export default async function router(request: IncomingMessage, response: ServerResponse) {
  const url = new URL(request.url ?? '/', 'http://localhost');
  const route = url.searchParams.get('__route');
  if (route !== null) {
    url.pathname = '/api/' + route;
    url.searchParams.delete('__route');
    request.url = url.pathname + url.search;
  }
  return handle(request, response);
}
