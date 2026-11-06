/* Starter loadouts and cached-sprite palettes. All characters keep the same
   base attributes; weapons, upgrades and elemental trees remain available. */
const CharacterRoster=(()=>{
 'use strict';
 const list=[
  {id:'nopal',name:'Nopal',title:'O Último Cacto',weapon:'revolver',color:'#caa364',desc:'Precisão e ritmo constante para abrir caminho pelo Oeste.',role:'TIROS PRECISOS',palette:{}},
  {id:'rosa',name:'Rosa da Serrada',title:'A Guardiã do Desfiladeiro',weapon:'shotgun',color:'#db8c75',desc:'Enfrenta grupos de perto com o leque de chumbo da espingarda.',role:'COMBATE PRÓXIMO',palette:{
   '#405c3d':'#466951','#536b40':'#60805a','#7b8950':'#98a66b','#293e32':'#2c443a',
   '#5c4130':'#6f3e37','#3e2e29':'#452d2d','#725239':'#91594a','#876445':'#ae7756',
   '#a13e3c':'#3e7778','#c46a50':'#7eaba0','#702c32':'#2f505a','#48272d':'#263c47',
   '#8c7955':'#78605a','#776849':'#67504c','#5e5340':'#4d3d40'}},
  {id:'bento',name:'Bento Pavio-Curto',title:'O Demolidor da Mina',weapon:'dynamite',color:'#d4ac59',desc:'Planeja o lançamento e abre espaço com explosões de grande área.',role:'EXPLOSÕES EM ÁREA',palette:{
   '#405c3d':'#667044','#536b40':'#7e824d','#7b8950':'#a4a468','#293e32':'#454c32',
   '#5c4130':'#4d4238','#3e2e29':'#322e2c','#725239':'#76634a','#876445':'#9a8257',
   '#a13e3c':'#ae633b','#c46a50':'#df9d55','#702c32':'#79452d',
   '#8c7955':'#9d7949','#776849':'#795c3b','#5e5340':'#5c4735'}},
  {id:'iris',name:'Íris do Trovão',title:'A Laçadora da Meia-Noite',weapon:'lasso',color:'#86c8d0',desc:'Controla grupos com descargas que saltam entre inimigos próximos.',role:'CORRENTES ELÉTRICAS',palette:{
   '#405c3d':'#3c625f','#536b40':'#527e71','#7b8950':'#86aa8c','#293e32':'#293f43',
   '#5c4130':'#363846','#3e2e29':'#292b36','#725239':'#51526a','#876445':'#727084',
   '#a13e3c':'#76527d','#c46a50':'#ad80a0','#702c32':'#4e385d','#48272d':'#30293e',
   '#8c7955':'#647d7e','#776849':'#4c626a','#5e5340':'#374c58','#bda66a':'#a9bdb8'}}
 ];
 function get(id){return list.find(c=>c.id===id)||list[0]}
 function layout(W,H){
  const cols=(W>=1000&&H>=500)||(W>=540&&W>H*1.3&&H<500)?4:2,gap=W<600?8:14,pad=W<600?12:24;
  const width=Math.min(270,(W-pad*2-gap*(cols-1))/cols),rows=Math.ceil(list.length/cols);
  const top=H*.2,bottom=Math.min(84,H*.17),height=Math.min(352,(H-top-bottom-gap*(rows-1))/rows);
  const left=(W-(cols*width+gap*(cols-1)))/2;
  return {columns:cols,cards:list.map((c,i)=>({x:left+(i%cols)*(width+gap),y:top+Math.floor(i/cols)*(height+gap),w:width,h:height,id:c.id})),
   start:{x:W/2-108,y:H-Math.min(57,H*.12),w:216,h:Math.min(38,H*.08)},back:{x:12,y:10,w:106,h:30}};
 }
 function inside(p,r){return p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h}
 function wrap(g,text,x,y,width,lineH,max){let line='',lines=[];
  for(const word of text.split(' ')){const next=line?line+' '+word:word;if(line&&g.measureText(next).width>width){lines.push(line);line=word}else line=next}
  if(line)lines.push(line);lines.slice(0,max).forEach((s,i)=>g.fillText(i===max-1&&lines.length>max?s+'…':s,x,y+lineH*i));return Math.min(lines.length,max)*lineH;
 }
 function draw(g,W,H,selected,preview,weapons,t){
  const l=layout(W,H);g.save();g.imageSmoothingEnabled=false;
  g.fillStyle='#191f28';g.fillRect(0,0,W,H);
  for(let i=0;i<6;i++){g.fillStyle=i%2?'#262b31':'#22272e';g.fillRect(i*W/6,H*.75+(i%3)*12,W/6,H*.25)}
  g.textAlign='center';g.fillStyle='#efd5a0';g.font=`bold ${Math.min(32,W*.055)}px Georgia`;g.fillText('ESCOLHA SEU FORASTEIRO',W/2,H*.09);
  g.fillStyle='#b7b8ac';g.font=`${Math.min(14,W*.029)}px Georgia`;g.fillText('Uma arma inicial. Todas as builds continuam abertas.',W/2,H*.14);
  l.cards.forEach((r,i)=>{
   const c=list[i],picked=c.id===selected,compact=r.h<315||r.w<185,small=r.w<185;
   g.save();g.beginPath();g.rect(r.x,r.y,r.w,r.h);g.clip();
   g.fillStyle=picked?'#37352d':'#252b31';g.fillRect(r.x,r.y,r.w,r.h);
   g.strokeStyle=picked?c.color:'#50534e';g.lineWidth=picked?3:1;g.strokeRect(r.x+1,r.y+1,r.w-2,r.h-2);
   g.fillStyle=c.color;g.fillRect(r.x+5,r.y+5,r.w-10,2);g.font=`bold ${small?10:11}px Georgia`;
   g.fillText((picked?'◆ ':'')+'['+(i+1)+'] '+c.role,r.x+r.w/2,r.y+21);
   const scale=!compact&&r.w>=200?2:1,heroY=r.y+(compact?70:132);
   preview(c,r.x+r.w/2-(scale===2?12:5),heroY,scale,t);
   g.fillStyle='#eee0bb';g.font=`bold ${small?13:17}px Georgia`;
   const nameY=compact?108:190,nameHeight=wrap(g,c.name,r.x+r.w/2,r.y+nameY,r.w-16,small?16:19,2);
   g.fillStyle=c.color;g.font=`${small?10:12}px Georgia`;
   const weaponY=nameY+nameHeight+10,weaponHeight=wrap(g,weapons[c.weapon].name,r.x+r.w/2,r.y+weaponY,r.w-18,14,2),descY=weaponY+weaponHeight+14;
   if(descY+16<r.h-8){g.fillStyle='#bdb8a8';g.font=`${small?11:12}px Georgia`;wrap(g,c.desc,r.x+r.w/2,r.y+descY,r.w-26,16,Math.min(3,Math.floor((r.h-descY-8)/16)))}
   g.restore();
  });
  g.fillStyle='#b9985a';g.fillRect(l.start.x,l.start.y,l.start.w,l.start.h);g.fillStyle='#221f24';g.font='bold 15px Georgia';g.fillText('PARTIR · ENTER',W/2,l.start.y+l.start.h*.67);
  g.fillStyle='#8d917f';g.font='12px Georgia';g.fillText('ESC · VOLTAR',l.back.x+l.back.w/2,l.back.y+20);g.restore();
 }
 return {list,get,layout,inside,draw};
})();
