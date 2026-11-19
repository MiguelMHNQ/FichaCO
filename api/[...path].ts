import { createApi } from '../backend/http/api.js';
import { configuredOptions } from '../backend/runtime.js';
// Sem credenciais não há fallback de memória no deploy.
export default createApi(configuredOptions());
