const fs=require('node:fs'),path=require('node:path');
module.exports=async({owner,player,send,assert,errors,profile})=>{
  const asset=async color=>owner.run(`(()=>{const c=document.createElement('canvas');c.width=c.height=8;const ctx=c.getContext('2d');ctx.fillStyle=${JSON.stringify(color)};ctx.fillRect(0,0,8,8);return PrimordiosSessao.upload(c.toDataURL());})()`);
  const bg=await asset('#e8e0d1'),green=await asset('#70d595'),red=await asset('#ef7468');
  const image=(id,src,x,y,w,h,extra={})=>({type:'put',kind:'imagens',id,value:{src,camadaId:'base',x,y,w,h,...extra}});
  await owner.run(`PrimordiosSessao.mutate(${JSON.stringify([image('mapa',bg,0,0,1400,1000),image('rosto',green,0,0,20,20,{token:true,luz:{ativa:true,raio:4.5,suave:false,tipo:'rosto'}}),image('tocha',red,140,100,20,20,{luz:{ativa:true,raio:4.5,suave:false,tipo:'tocha'}}),image('visivel',green,180,190,10,10,{token:true}),image('oculto',red,150,0,10,10,{token:true}),{type:'wall.put',id:'w',value:{id:'w',forma:'linha',a:{x:100,y:-100},b:{x:100,y:100}}},{type:'vision.settings',value:{escuro:true}}])})`);
  await player.wait('PrimordiosSessao.state.scene.visao?.escuro&&PrimordiosSessao.state.scene.imagens.some(i=>i.id==="visivel")&&!PrimordiosSessao.state.scene.imagens.some(i=>i.id==="oculto")');
  await player.wait(`document.getElementById('mesa').getContext('2d').getImageData(780,640,1,1).data[1]>150`);
  assert.equal(await player.run(`document.getElementById('mesa').getContext('2d').getImageData(750,450,1,1).data[0]`),0,'A tocha acesa não revela a região atrás da parede');
  await owner.run(`PrimordiosSessao.mutate([{type:'door.put',id:'d',value:{id:'d',paredeId:'w',inicio:.45,fim:.55,aberta:true}}])`);await player.wait('PrimordiosSessao.state.scene.imagens.some(i=>i.id==="oculto")');await player.wait(`document.getElementById('mesa').getContext('2d').getImageData(750,450,1,1).data[0]>100`);
  await owner.run(`PrimordiosSessao.mutate([{type:'door.put',id:'d',value:{id:'d',paredeId:'w',inicio:.45,fim:.55,aberta:false}}])`);await player.wait('!PrimordiosSessao.state.scene.imagens.some(i=>i.id==="oculto")');await player.wait(`document.getElementById('mesa').getContext('2d').getImageData(750,450,1,1).data[0]===0`);
  await owner.run('visaoPrevia.click()');assert.equal(await owner.run(`document.getElementById('mesa').getContext('2d').getImageData(750,450,1,1).data[0]`),0,'Prévia do mestre usa a mesma linha de visão');
  const capture=await send('Page.captureScreenshot',{format:'png'},player.sessionId);fs.writeFileSync(path.join(profile,'tocha-linha-de-visao.png'),Buffer.from(capture.data,'base64'));
  assert.deepEqual(errors,[]);console.log('OK: encontro das luzes sem alcançar o centro, visão ampliada no trecho descoberto, parede impede visão através da tocha, porta abre/fecha a visão e prévia igual. Captura: '+path.join(profile,'tocha-linha-de-visao.png'));
};
