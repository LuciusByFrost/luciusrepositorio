/* Chest rewards and pixel art. Rewards use the level at collection/answer,
   not the level when the chest spawned. Drawing never grants rewards. */
const ChestSystem=(()=>{
 'use strict';
 const balance={growth:1.25,commonXP:12,bossXP:30,knowledgeMultiplier:2},TAU=Math.PI*2;
 const knowledgeBases=(globalThis.NETWORK_QUESTION_BANK||[]).map(q=>q.reward.xp);
 const knowledgeMin=knowledgeBases.length?Math.min(...knowledgeBases):6,knowledgeMax=knowledgeBases.length?Math.max(...knowledgeBases):14;
 const styles={
  common:{name:'BAÚ DO OESTE',wood:'#805337',light:'#ad7944',metal:'#c19b5a',accent:'#e2bd79'},
  boss:{name:'ESPÓLIO DO CHEFE',wood:'#3d4248',light:'#626367',metal:'#d2ae62',accent:'#ffe29b'},
  knowledge:{name:'BAÚ DO CONHECIMENTO',wood:'#344b50',light:'#547b78',metal:'#beaa68',accent:'#a9e7d3'}
 };
 function type(c){return c?.knowledge?'knowledge':c?.kind==='boss'?'boss':'common'}
 function reward(level,kind='common',questionXP=6){
  const n=Number.isFinite(level)?Math.max(1,Math.floor(level)):1;
  const base=kind==='boss'?balance.bossXP:kind==='knowledge'?Math.max(0,Number.isFinite(questionXP)?questionXP:0)*balance.knowledgeMultiplier:balance.commonXP;
  if(base<=0)return 0;
  if(n-1>Math.log(Number.MAX_SAFE_INTEGER/base)/Math.log(balance.growth))return Number.MAX_SAFE_INTEGER;
  return Math.min(Number.MAX_SAFE_INTEGER,Math.round(base*Math.pow(balance.growth,n-1)));
 }
 function create(x,y,kind='common',bossName=''){return {x,y,bob:0,kind:kind==='boss'?'boss':'common',bossName,rewardClaimed:false}}
 function preview(level,chest){
  const kind=type(chest);if(kind!=='knowledge')return reward(level,kind);
  if(chest.quiz)return reward(level,kind,chest.quiz.question.reward.xp);
  return format(reward(level,kind,knowledgeMin))+'–'+format(reward(level,kind,knowledgeMax));
 }
 function burst(game,chest,amount){
  const list=game.chestBursts||=[];list.push({x:chest.x,y:chest.y,kind:type(chest),amount,start:game.time});
  if(list.length>12)list.splice(0,list.length-12);
 }
 function tick(game){if(game.chestBursts?.length)game.chestBursts=game.chestBursts.filter(c=>game.time-c.start<.8)}
 function format(amount){return Math.round(amount).toLocaleString('pt-BR')}
 function pixel(g,c,x,y,w=2,h=w){g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h)}
 const cache={};
 for(const [kind,s] of Object.entries(styles)){
  const make=paint=>{const c=document.createElement('canvas');c.width=c.height=48;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.translate(24,30);paint((c,x,y,w,h)=>pixel(g,c,x,y,w,h));return c};
  cache[kind]={body:make(r=>{
   r('#181f26',-17,-6,34,20);r(s.wood,-15,-4,30,16);r(s.light,-14,-3,11,11);
   r('#322c2c',-14,2,27,1);r('#322c2c',-14,7,27,1);r(s.wood,-11,-2,2,13);
   r(s.metal,-15,-5,4,18);r(s.metal,11,-5,4,18);r(s.accent,-15,-4,1,14);r(s.accent,11,-4,1,14);
   r('#242629',-3,-4,7,10);r(s.metal,-2,-3,5,8);r(s.accent,-1,-2,3,2);r('#27282b',0,1,1,3);
   r('#332d2a',-14,13,7,2);r('#332d2a',7,13,7,2);
   for(const x of [-13,12])for(const y of [-2,9])r('#f1d69c',x,y,1,1);
   if(kind==='boss'){r('#d2ae62',-8,0,3,5);r('#d2ae62',6,0,3,5);r('#ffe29b',-7,1,1,2);r('#ffe29b',7,1,1,2)}
   if(kind==='knowledge'){r('#91c4b1',-9,0,3,5);r('#d9edc6',-8,1,1,3);r('#91c4b1',6,0,3,5)}
  }),lid:make(r=>{
   r('#181f26',-17,-13,34,8);r('#181f26',-14,-17,28,5);r(s.wood,-15,-12,30,6);r(s.light,-13,-15,26,5);
   r(s.metal,-15,-13,4,8);r(s.metal,11,-13,4,8);r(s.accent,-13,-15,25,1);
   r(s.metal,-16,-7,32,2);r('#eed399',-15,-7,30,1);
   if(kind==='boss'){r('#d2ae62',-2,-18,4,6);r('#d2ae62',-5,-16,10,2);r('#ffe29b',-1,-17,2,3)}
   if(kind==='knowledge'){r('#b0e7ce',-3,-15,6,5);r('#253f46',-1,-14,2,3)}
  })};
 }
 function draw(g,c,x,y,t,amount,near=false){
  const kind=type(c),style=styles[kind],bob=Math.round(Math.sin(t*3+c.x*.04+c.y*.03)),opened=!!c.opening;
  x=Math.round(x);y=Math.round(y+bob);g.save();g.imageSmoothingEnabled=false;
  pixel(g,'#10171f99',x-20,y+13,40,4);pixel(g,'#10171f66',x-16,y+16,32,2);
  if(kind!=='common'){g.save();g.globalAlpha=.35+.15*Math.sin(t*4);pixel(g,style.accent,x-19,y+12,38,2);g.restore()}
  g.drawImage(cache[kind].body,x-24,y-30);
  if(opened)pixel(g,'#f7d97c',x-12,y-7,24,2);
  g.drawImage(cache[kind].lid,x-24,y-30-(opened?8:0));
  for(let i=0;i<(kind==='common'?2:4);i++){
   const phase=(t*.75+i*.27)%1,xx=x+Math.sin(i*3.1+c.x)*18,yy=y-13-phase*19;
   g.save();g.globalAlpha=Math.sin(phase*Math.PI)*.75;pixel(g,style.accent,xx,yy,1+(i%2),2);g.restore();
  }
  if(kind==='knowledge'&&!opened){
   pixel(g,'#202a32',x-6,y-35,12,13);g.fillStyle=style.accent;g.textAlign='center';g.font='bold 13px Georgia';g.fillText('?',x,y-25);
  }
  if(near&&!opened){
   const label=kind==='knowledge'?'E · ABRIR':kind==='boss'?'ESPÓLIO DO CHEFE':'BAÚ DO OESTE';
   const xpLabel=(kind==='knowledge'?'ACERTO: ':'')+'+'+(typeof amount==='string'?amount:format(amount))+' XP';
   g.font='11px Georgia';const width=Math.max(110,Math.min(260,Math.max(g.measureText(label).width,g.measureText(xpLabel).width)+20));
   pixel(g,'#131b25ed',x-width/2,y+23,width,35);g.textAlign='center';g.font='bold 10px Georgia';g.fillStyle=style.accent;
   g.fillText(label,x,y+36);g.font='11px Georgia';g.fillStyle='#eee0b4';g.fillText(xpLabel,x,y+50);
  }
  g.restore();
 }
 function effects(g,game,sx,sy){
  if(!game.chestBursts?.length)return;g.save();g.imageSmoothingEnabled=false;
  for(const c of game.chestBursts){
   const age=game.time-c.start;if(age<0||age>=.8)continue;const u=age/.8,x=sx(c.x),y=sy(c.y),style=styles[c.kind];
   g.globalAlpha=Math.min(1,(1-u)*2);g.drawImage(cache[c.kind].body,x-24,y-30);
   pixel(g,style.accent,x-12,y-8,24,3);
   g.drawImage(cache[c.kind].lid,x-24,y-30-Math.round(Math.sin(Math.min(1,u*2)*Math.PI/2)*12));
   for(let i=0;i<10;i++){
    const a=i*TAU/10,r=6+u*28;pixel(g,i%2?style.accent:'#e5d5a0',x+Math.cos(a)*r,y-12+Math.sin(a)*r*.6-u*14,2,3);
   }
   g.textAlign='center';g.font='bold 15px Georgia';g.fillStyle='#161b22';g.fillText('+'+format(c.amount)+' XP',x+1,y-38-u*22+1);
   g.fillStyle=style.accent;g.fillText('+'+format(c.amount)+' XP',x,y-38-u*22);
  }
  g.restore();
 }
 return {balance,styles,type,reward,preview,create,burst,tick,draw,effects,format};
})();
