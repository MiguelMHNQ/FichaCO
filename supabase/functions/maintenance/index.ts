import { createClient } from 'npm:@supabase/supabase-js@2.118.0';

// A chave administrativa é fornecida pelo runtime Supabase, nunca pelo frontend.
// O JWT do gateway é substituído por um segredo próprio de 256 bits validado no banco.
Deno.serve(async (request:Request)=>{
  if(request.method!=='POST')return new Response('',{status:405});
  if(Number(request.headers.get('content-length')||0)>1024)return new Response('',{status:413});
  try{
    const reader=request.body?.getReader();let raw='',size=0;if(reader){const decoder=new TextDecoder();for(;;){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>1024){await reader.cancel();return new Response('',{status:413});}raw+=decoder.decode(value,{stream:true});}raw+=decoder.decode();}
    const {token}=JSON.parse(raw);if(typeof token!=='string'||!/^[0-9]{10}\.[a-f0-9]{64}$/.test(token))return new Response('',{status:401});
    const client=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(20000)})}});
    const {data,error}=await client.rpc('primordios_maintenance',{token});
    if(error)return new Response('',{status:401});
    const paths=data?.paths;
    if(!Array.isArray(paths)||paths.some(p=>typeof p!=='string'||!/^\d{6}\/[a-f0-9-]{36}\.[a-z0-9]{1,5}$/.test(p)))return new Response('',{status:500});
    if(paths.length){const {error:deletion}=await client.storage.from('tabletop-assets').remove(paths);if(deletion)return new Response('',{status:503});}
    return Response.json({ok:true,removed:paths.length},{headers:{'Cache-Control':'no-store'}});
  }catch{return new Response('',{status:500});}
});
