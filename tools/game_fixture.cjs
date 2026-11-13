// Shared real-game harness for logic tests. Canvas is deliberately simulated.
const fs=require('node:fs'),vm=require('node:vm');
function boot(options={}){
 let seed=17,width=options.width||1200,height=options.height||800,created=0,draws=0;
 const math=Object.create(Math);math.random=()=>((seed=seed*16807%2147483647)-1)/2147483646;
 const text=[],context=new Proxy({measureText:s=>({width:String(s).length*6.8}),fillText:s=>{if(text.length<5000)text.push(String(s))},drawImage(){draws++}},
  {get:(o,k)=>o[k]??(o[k]=()=>({addColorStop(){}})),set:(o,k,v)=>(o[k]=v,true)});
 const events={},storage=options.storage||new Map([['cactus-save',JSON.stringify({sound:false,...options.save})]]);if(options.isacSave)storage.set('cactus-isac-save',JSON.stringify(options.isacSave));
 const element=()=>({getContext:()=>context,querySelector:()=>element(),addEventListener(){},getBoundingClientRect:()=>({width,height,left:0,top:0}),style:{}});
 const box={console,Math:math,performance:{now:()=>1000},localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},requestAnimationFrame(){},
  addEventListener:(type,fn)=>(events[type]||=[]).push(fn),document:{querySelector:()=>element(),createElement:()=>{created++;return element()}}};
 Object.assign(box,options.globals);box.document.baseURI='file:///game/js/main.js';
 box.window=box;vm.createContext(box);
 for(const file of ['desert_background','isac_shop','network_questions','knowledge_chests','characters','hero_sprite','../assets/characters/nopal/atlas','nopal_sprite','../assets/characters/rosa/atlas','rosa_sprite','../assets/characters/bento/atlas','bento_sprite','../assets/characters/iris/atlas','iris_sprite','../assets/weapons/atlas','weapon_sprites','player_sprite','weapon_visuals','elements','element_visuals','../assets/enemy_atlas','enemy_sprites','bosses','chests'])vm.runInContext(fs.readFileSync(`js/${file}.js`,'utf8'),box);
 const api='openIsacShop,knowledgeLayout,knowledgeAnswerRects,knowledgeContinueRect,endGame,newGame,update,draw,drawWorld,drawTitle,drawHUD,drawUpgrade,drawCharacterSelect,drawCharacterPreview,damageEnemy,fireWeapon,spawnEnemy,shootHostile,hurtPlayer,openUpgrades,pickUpgrade,openChest,grantChestXP,answerKnowledgeQuestion,drawKnowledgePanel,awardKnowledgeReward,interactWithKnowledgeChest,closeKnowledgePanel,upgradeLayout,handleClick,handleGameKeyDown,openCharacterSelect,handleCharacterClick,resize,keys,improveWeapon,canTakeUpgrade,takeUpgrade,upgradePool';
 const source=(options.mainSource||fs.readFileSync('js/main.js','utf8')).replace(/\}\)\(\);\s*$/,`globalThis.testGame={${api},get game(){return game},get screen(){return screen},get selected(){return selectedCharacterId},setScreen:s=>screen=s};})();`);
 vm.runInContext(source,box);if(options.autoStart!==false)box.testGame.newGame();
 return {I:box.IsacShop,p:box.testGame,N:vm.runInContext('EnemySprites',box),E:vm.runInContext('ElementSystem',box),V:vm.runInContext('ElementVisuals',box),C:vm.runInContext('CharacterRoster',box),B:vm.runInContext('BossSystem',box),Ch:vm.runInContext('ChestSystem',box),K:vm.runInContext('KnowledgeChestSystem',box),ctx:context,text,storage,
  stats:()=>({created,draws}),dispatch:(type,event)=>{for(const fn of events[type]||[])fn(event)},
  setViewport:(w,h)=>{width=w;height=h;box.testGame.resize()}};
}
module.exports={boot};
