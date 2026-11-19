import { createClient } from '@supabase/supabase-js';
import { createCharacterClient } from './characters.js';

const isLogin = location.pathname.endsWith('/tela0.html');
const isProfile = location.pathname.endsWith('/configurar-perfil.html');
const isRecovery = location.pathname.endsWith('/recuperar-senha.html');
const signedInPage = !isLogin && !isRecovery && location.pathname.includes('/pages/');
let client, verifiedUser, initError;
const readMarker = () => { try { return JSON.parse(localStorage.getItem('primordios_logado')); } catch { return null; } };
function validName(value) {
  if (typeof value !== 'string') return false;
  const name = value.trim().normalize('NFC');
  return [...name].length >= 3 && [...name].length <= 40 && !/[<>\p{Cc}\p{Cf}]/u.test(name);
}
function profileComplete(user) {
  return user?.user_metadata?.primordios_profile_complete === true && validName(user.user_metadata.display_name);
}
function clearWorkingState() {
  for (const key of Object.keys(sessionStorage)) {
    if (key.startsWith('fragmentados_') || key.startsWith('primordios_mapa_')) sessionStorage.removeItem(key);
  }
}
function recordUser(user) {
  if (readMarker()?.usuario !== user.id) clearWorkingState();
  verifiedUser = user;
  // Nome público não altera a chave de propriedade, que continua sendo o UUID.
  localStorage.setItem('primordios_logado', JSON.stringify({
    usuario: user.id, id: user.id, nome: profileComplete(user) ? user.user_metadata.display_name.trim() : 'Jogador', online: true
  }));
}
function forgetUser() {
  verifiedUser = undefined;
  localStorage.removeItem('primordios_logado');
  sessionStorage.removeItem('primordios_recovery');
  clearWorkingState();
}
function cleanCallbackUrl() {
  const url = new URL(location.href);
  for (const key of ['code', 'error', 'error_code', 'error_description']) url.searchParams.delete(key);
  url.hash = '';
  history.replaceState(null, '', url.pathname + url.search);
}
const ready = (async () => {
  try {
    const callbackError = new URL(location.href).searchParams.has('error');
    const response = await fetch('/api/auth/config', { cache: 'no-store', signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error('Abra o site pelo servidor iniciado com npm run dev.');
    const config = await response.json();
    if (!config.enabled) throw new Error('O login online ainda não foi configurado neste servidor.');
    client = createClient(config.url, config.publishableKey, {
      auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(15_000) }) }
    });
    client.auth.onAuthStateChange((event, session) => {
      // Nenhuma chamada assíncrona ao SDK dentro deste callback (lock interno).
      if (event === 'SIGNED_OUT') { forgetUser(); if (signedInPage) location.replace('tela0.html'); }
      if (['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event) && signedInPage && verifiedUser && session?.user.id !== verifiedUser.id) {
        document.documentElement.classList.add('auth-pendente'); location.reload();
      }
    });
    const { data: initialized, error: sessionError } = await client.auth.getSession();
    if (sessionError || callbackError) throw new Error('Não foi possível concluir a entrada com Google. Tente novamente.');
    if (initialized.session) {
      const { data, error } = await client.auth.getUser();
      if (error) {
        if (error.status === 401 || error.status === 403) { await client.auth.signOut({ scope: 'local' }); forgetUser(); }
        else throw new Error('Não foi possível validar sua sessão. Tente novamente.');
      } else if (data.user) recordUser(data.user);
    } else forgetUser();
    if (isLogin || isRecovery) cleanCallbackUrl();
    if (signedInPage && !verifiedUser) { location.replace('tela0.html'); return false; }
    if (signedInPage && !isProfile && !profileComplete(verifiedUser)) { location.replace('configurar-perfil.html'); return false; }
    return true;
  } catch (error) {
    initError = error instanceof Error ? error.message : 'Não foi possível conectar ao login.';
    if (isLogin || isRecovery) cleanCallbackUrl();
    if (signedInPage) location.replace('tela0.html');
    return false;
  }
})();
async function available() {
  if (!await ready || !client) throw new Error(initError || 'Login indisponível.');
  return client;
}
const auth = {
  ready,
  async roomChannel(topic, onEvent, onStatus) {
    if (!/^(tabletop:\d{6}|laser:\d{6}:[0-9a-f-]{36})$/.test(topic)) throw new Error('Canal inválido.');
    const api=await available();await api.realtime.setAuth();
    const channel=api.channel(topic,{config:{private:true,broadcast:{self:false,ack:true}}});
    channel.on('broadcast',{event:'*'},message=>onEvent(message.event,message.payload));
    channel.subscribe(status=>onStatus?.(status));
    return {send:(event,payload)=>channel.send({type:'broadcast',event,payload}),close:()=>api.removeChannel(channel)};
  },
  async uploadRoomAsset(code,file) {
    if(!/^\d{6}$/.test(code))throw new Error('Código inválido.');
    const extensions={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif','audio/mpeg':'mp3','audio/ogg':'ogg','audio/wav':'wav','audio/x-wav':'wav','audio/mp4':'m4a','audio/webm':'webm','video/mp4':'mp4','video/webm':'webm'};
    const ext=extensions[file.type];if(!ext||file.size>50*1024*1024)throw new Error('Escolha imagem, áudio ou vídeo de até 50 MB.');
    if(file.type==='image/gif'&&file.size>10*1024*1024)throw new Error('GIF: máximo de 10 MB.');
    if(file.type.startsWith('video/')&&file.size>40*1024*1024)throw new Error('Vídeo: máximo de 40 MB.');
    const api=await available();const reservation=await auth.request('/api/rooms/'+code+'/uploads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({size:file.size,mime:file.type})});if(!reservation.ok)throw new Error('Limite de uploads atingido ou sessão indisponível.');const {path}=await reservation.json();
    const {error}=await api.storage.from('tabletop-assets').upload(path,file,{contentType:file.type,cacheControl:'120',upsert:false});
    if(error)throw new Error('Não foi possível enviar o arquivo da sessão.');return path;
  },
  async roomAssetUrl(path) {
    if(!/^\d{6}\/[a-f0-9-]{36}\.[a-z0-9]{1,5}$/.test(path))throw new Error('Arquivo inválido.');
    const api=await available(),{data,error}=await api.storage.from('tabletop-assets').createSignedUrl(path,120);
    if(error||!data?.signedUrl)throw new Error('Arquivo indisponível nesta sessão.');return data.signedUrl;
  },
  async status() { await ready; return { user: verifiedUser, profileComplete: profileComplete(verifiedUser), error: initError }; },
  async google() {
    const api = await available();
    const { error } = await api.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: new URL('tela0.html', location.href).href, queryParams: { prompt: 'select_account' } }
    });
    if (error) throw new Error('Não foi possível iniciar a entrada com Google. Tente novamente.');
  },
  async saveName(value) {
    const api = await available();
    const name = typeof value === 'string' ? value.trim().normalize('NFC') : '';
    if (!validName(name)) throw new Error('Use de 3 a 40 caracteres, sem marcações ou caracteres de controle.');
    if (!verifiedUser) throw new Error('Entre com Google para escolher seu nome.');
    const { data, error } = await api.auth.updateUser({ data: { display_name: name, primordios_profile_complete: true } });
    if (error || !data.user) throw new Error('Não foi possível salvar seu nome. Tente novamente.');
    if (!profileComplete(data.user)) throw new Error('Seu nome não foi confirmado. Tente novamente.');
    recordUser(data.user);
  },
  async sair() {
    try {
      const api = await available();
      const { error } = await api.auth.signOut({ scope: 'local' });
      if (error) throw error;
    } catch {
      if (client) { alert('Não foi possível concluir a saída. Tente novamente.'); return; }
    }
    forgetUser(); location.replace('tela0.html');
  },
  async request(path, options = {}) {
    const api = await available();
    if (!profileComplete(verifiedUser)) throw new Error('Escolha seu nome público para continuar.');
    if (!path.startsWith('/api/') || path.startsWith('//')) throw new Error('Destino inválido.');
    const { data, error } = await api.auth.getSession();
    if (error || !data.session) throw new Error('Entre novamente para continuar.');
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${data.session.access_token}`);
    const response = await fetch(path, { ...options, headers, cache: 'no-store' });
    if (response.status === 401) throw new Error('Sua sessão expirou. Entre novamente.');
    return response;
  }
};
window.PrimordiosAuth = auth;
window.CloudFichas = createCharacterClient(auth);
window.addEventListener('pageshow', event => {
  if (event.persisted && signedInPage) { document.documentElement.classList.add('auth-pendente'); location.reload(); }
});
window.addEventListener('storage', event => {
  if (signedInPage && verifiedUser && event.key === 'primordios_logado' && (readMarker()?.id !== verifiedUser.id || readMarker()?.nome !== verifiedUser.user_metadata?.display_name)) {
    document.documentElement.classList.add('auth-pendente'); location.reload();
  }
});
if (signedInPage) {
  document.documentElement.classList.add('auth-pendente');
  ready.then(ok => { if (ok) document.documentElement.classList.remove('auth-pendente'); });
}
