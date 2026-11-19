module.exports=async({owner,player,send,sleep,assert,errors})=>{
  const viewport=async(tab,width,height)=>{await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true},tab.sessionId);await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5},tab.sessionId);await sleep(120);};
  for(const tab of [owner,player]){
    for(const [width,height]of [[320,740],[390,844],[844,390]]){
      await viewport(tab,width,height);
      assert.ok(await tab.run(`document.documentElement.scrollWidth<=innerWidth+1`),'Sessão cabe na tela');
      assert.ok(await tab.run(`document.querySelector('.ferramentas').getBoundingClientRect().height<90`));
      assert.ok(await tab.run(`(()=>{const a=arquivo.getBoundingClientRect(),r=sessaoParticipantes.getBoundingClientRect();return r.left>=a.right&&r.bottom<document.querySelector('.ferramentas').getBoundingClientRect().top;})()`),'Participantes na linha superior');
      await tab.run(`sessaoFicha.click()`);await tab.wait(`!document.querySelector('.sessao-ficha').hidden`);
      assert.ok(await tab.run(`(()=>{const r=document.querySelector('.sessao-ficha').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight&&r.height>100;})()`));
      await tab.run(`document.querySelector('.sessao-ficha header button').click()`);
    }
    await viewport(tab,390,844);
  }
  await owner.run(`document.querySelector('.arquivo').classList.add('aberto')`);
  await owner.wait(`sessaoParticipantes.getBoundingClientRect().top>=menuArquivo.getBoundingClientRect().bottom+10`);
  await owner.run(`document.querySelector('.arquivo').classList.remove('aberto')`);
  await owner.run(`PrimordiosSessao.mutate([{type:'media.add',value:{id:'mobile-audio',kind:'audio',type:'youtube',path:'dQw4w9WgXcQ',title:'Mobile'}},{type:'playback',kind:'audio',value:{sourceId:'mobile-audio',position:0,playing:false,loop:false,endWhenFinished:true}}])`);
  await player.wait(`!!PrimordiosSessao.state.audio`);
  assert.equal(await owner.run(`getComputedStyle(document.querySelector('.sessao-audio-controles')).display`),'none');
  await owner.run(`document.querySelector('.sessao-audio-expandir').click()`);
  assert.notEqual(await owner.run(`getComputedStyle(document.querySelector('.sessao-audio-controles')).display`),'none');
  assert.equal(await player.run(`document.querySelector('.sessao-audio-expandir').hidden`),true);
  assert.equal(await player.run(`document.querySelector('.sessao-audio-controles').hidden`),true);
  assert.ok(await owner.run(`(()=>{const r=document.querySelector('.sessao-audio-stack').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom<document.querySelector('.rodape').getBoundingClientRect().top;})()`),'Música acima do rodapé');
  await owner.run(`PrimordiosSessao.media.control('audio','stop')`);await player.wait(`!PrimordiosSessao.state.audio`);
  assert.deepEqual(errors,[]);
  console.log('OK: sessão com dois usuários em 320/390 px e paisagem, participantes, menu, ficha lateral, música compacta expansível e permissões preservadas.');
};
