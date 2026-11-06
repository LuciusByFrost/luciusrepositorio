/* Review only: --preview --chests; ?mode=quiz or ?mode=play. */
(()=>{
 const h=heroPreview,Ch=ChestSystem,K=KnowledgeChestSystem,c=document.querySelector('#game'),ctx=c.getContext('2d'),mode=new URLSearchParams(location.search).get('mode');
 h.setSound(false);window.addEventListener('error',e=>document.documentElement.dataset.chestError=e.message);
 if(mode){c.style.width='100vw';c.style.height='100vh';window.dispatchEvent(new Event('resize'))}
 function start(level){h.newGame();const g=h.game;g.level=level;g.xp=0;g.xpNeed=12;for(let i=1;i<level;i++)g.xpNeed=Math.floor(g.xpNeed*1.23+4);g.spawn=g.nextBoss=10000;Object.values(g.weapons).forEach(w=>w.level=0);return g}
 function drain(){for(let i=0;i<100&&h.game.choices.length;i++)h.pickUpgrade(0)}
 function quiz(g){g.knowledgeUsed=new Set();const chest=K.create(20,0,1);g.chests=[chest];h.interactWithKnowledgeChest();g.knowledgeQuiz.quiz.question.reward={xp:8,weaponChance:0};return chest}
 function paint(){
  ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;
  if(mode==='quiz'){const g=start(10);quiz(g);h.draw();return}
  if(mode==='play'){
   let g=start(10),chest=Ch.create(0,0);g.chests=[chest];h.update(.01);let valid=chest.rewardXP===89&&g.chests.length===0&&!h.openChest(chest);
   g=start(10);g.xp=g.xpNeed-1;chest=Ch.create(0,0,'boss');h.openChest(chest);valid&&=chest.rewardXP===224;drain();valid&&=g.level===12&&g.xp===21;
   g=start(20);g.xp=g.xpNeed-1;chest=quiz(g);const q=chest.quiz;h.answerKnowledgeQuestion(q.question.correct);
   const xp=q.rewardXP;h.awardKnowledgeReward(q);valid&&=xp===Ch.reward(20,'knowledge',8)&&q.rewardXP===xp;
   h.closeKnowledgePanel();drain();valid&&=g.chests.length===0&&g.level>20;
   document.documentElement.dataset.chestSmoke=valid?'passed':'failed';document.documentElement.dataset.chestQuizXp=String(xp);
   h.draw();ctx.fillStyle='#eee0b4';ctx.textAlign='left';ctx.font='15px Georgia';ctx.fillText('Baú comum +89 / chefe +224 / conhecimento +'+Ch.format(xp)+' XP · '+(valid?'OK':'FALHOU'),24,c.height-30);return;
  }
  const game=start(10);ctx.fillStyle='#1e252e';ctx.fillRect(0,0,1200,800);
  ctx.fillStyle='#e5cc96';ctx.textAlign='center';ctx.font='bold 28px Georgia';ctx.fillText('TESOUROS DO OESTE',600,48);
  ctx.fillStyle='#b5b9a9';ctx.font='16px Georgia';ctx.fillText('Nível 10 · XP cresce 25% por nível · evolução e melhorias preservadas',600,78);
  ['common','boss','knowledge'].forEach((kind,i)=>{
   const x=i*400+200,chest=kind==='knowledge'?K.create(0,0,i):Ch.create(0,0,kind);
   const amount=Ch.reward(10,kind,8);ctx.fillStyle=i%2?'#2b3037':'#303637';ctx.fillRect(i*400+8,108,384,650);
   ctx.fillStyle=Ch.styles[kind].accent;ctx.font='bold 19px Georgia';ctx.fillText(Ch.styles[kind].name,x,144);
   ctx.save();ctx.translate(x,282);ctx.scale(3,3);Ch.draw(ctx,chest,0,0,.25,amount,false);ctx.restore();
   Ch.draw(ctx,chest,x,398,.25,kind==='knowledge'?Ch.preview(10,chest):amount,true);
   ctx.fillStyle='#c6c4b1';ctx.font='14px Georgia';ctx.fillText(kind==='knowledge'?'XP apenas na resposta correta':'XP + recompensa de arma/tônico',x,495);
   Ch.effects(ctx,{time:.35,chestBursts:[{x,y:620,kind,amount,start:0}]},v=>v,v=>v);
   ctx.fillStyle='#c6c4b1';ctx.font='13px Georgia';ctx.fillText('ABERTURA E BÔNUS DE EXPERIÊNCIA',x,715);
  });
 }
 window.addEventListener('resize',paint);paint();
})();
