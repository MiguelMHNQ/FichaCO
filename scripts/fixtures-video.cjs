// Pequeno WebM de teste: quadros VP8 produzidos por canvas.toDataURL('image/webp').
module.exports=function webm(frames){
 const element=(id,data)=>{let bytes=1;while(data.length>=2**(7*bytes)-1)bytes++;let size=BigInt(data.length)|(1n<<BigInt(7*bytes));const header=Buffer.alloc(bytes);for(let i=bytes-1;i>=0;i--){header[i]=Number(size&255n);size>>=8n;}return Buffer.concat([Buffer.from(id,'hex'),header,data]);};
 const n=(id,v)=>element(id,Buffer.from([v]));const text=(id,s)=>element(id,Buffer.from(s));const group=(id,...parts)=>element(id,Buffer.concat(parts));
 const vp8=frames.map(src=>{const b=Buffer.from(src.split(',')[1],'base64');for(let p=12;p+8<=b.length;){const name=b.toString('ascii',p,p+4),size=b.readUInt32LE(p+4);if(name==='VP8 ')return b.subarray(p+8,p+8+size);p+=8+size+(size%2);}throw Error('Quadro WebP sem VP8.');});
 const duration=Buffer.alloc(8);duration.writeDoubleBE(2000);
 const header=group('1a45dfa3',n('4286',1),n('42f7',1),n('42f2',4),n('42f3',8),text('4282','webm'),n('4287',2),n('4285',2));
 const info=group('1549a966',element('2ad7b1',Buffer.from([15,66,64])),element('4489',duration),text('4d80','Primordios test'),text('5741','Primordios test'));
 const tracks=group('1654ae6b',group('ae',n('d7',1),n('73c5',1),n('83',1),text('86','V_VP8'),group('e0',n('b0',32),n('ba',32))));
 const blocks=Array.from({length:20},(_,i)=>{const prefix=Buffer.from([129,0,0,128]);prefix.writeInt16BE(i*100,1);return element('a3',Buffer.concat([prefix,vp8[i%vp8.length]]));});
 return Buffer.concat([header,group('18538067',info,tracks,group('1f43b675',n('e7',0),...blocks))]);
};
