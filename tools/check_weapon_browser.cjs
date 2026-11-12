// Exercise the actual index.html and keyboard/render path, without a generated game.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),port=Number(process.argv[2]||9227);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label,timeout=15000){
 const end=Date.now()+timeout;let last;
 do{
  try{last=await fn();if(last)return last}catch(error){if(!/navigated or closed|Execution context was destroyed|Cannot find context/i.test(error.message))throw error}
  await sleep(30);
 }while(Date.now()<end);
 throw Error('Timed out: '+label+' '+JSON.stringify(last));
}
async function connect(url){
 const socket=new WebSocket(url),pending=new Map();let next=0;
 await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})});
 socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}}});
 return {socket,send(method,params={}){return new Promise((resolve,reject)=>{const id=++next;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}))})}};
}

(async()=>{
 let browser,tab,server;
 try{
  const version=await until(async()=>{try{return await(await fetch('http://127.0.0.1:'+port+'/json/version')).json()}catch{return null}},'Chrome');
  browser=await connect(version.webSocketDebuggerUrl);
  const target=await browser.send('Target.createTarget',{url:'about:blank'});
  const page=(await(await fetch('http://127.0.0.1:'+port+'/json/list')).json()).find(p=>p.id===target.targetId);
  tab=await connect(page.webSocketDebuggerUrl);
  const errors=[];tab.socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown'||m.method==='Network.loadingFailed'||m.method==='Runtime.consoleAPICalled'&&['error','warning'].includes(m.params.type))errors.push(m)});
  await tab.send('Page.enable');await tab.send('Runtime.enable');await tab.send('Network.enable');
  await tab.send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
  async function ev(expression){const r=await tab.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||JSON.stringify(r.exceptionDetails));return r.result.value}
  async function capture(name){const r=await tab.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(__dirname,name+'.generated.png'),Buffer.from(r.data,'base64'))}
  for(const entry of ['index.html','luciusrepositorio/index.html']){
   await tab.send('Page.navigate',{url:pathToFileURL(path.join(root,entry)).href});
   await until(()=>ev('typeof WeaponSprites!=="undefined"&&WeaponSprites.ready()&&NopalSprite.status().ready&&RosaSprite.status().ready&&BentoSprite.status().ready&&IrisSprite.status().ready'),'file entry '+entry);
   await ev('window.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter"}));window.dispatchEvent(new KeyboardEvent("keyup",{key:"Enter"}))');
   await sleep(100);
  }
  // Serve the real files, adding only a test API at the closure boundary.
  server=http.createServer((req,res)=>{
   const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(root,'.'+name);
   if(path.relative(root,file).startsWith('..')){res.writeHead(403).end();return}
   fs.readFile(file,(err,bytes)=>{if(err){res.writeHead(404).end();return}
    res.setHeader('Content-Type',({'.js':'text/javascript','.png':'image/png','.html':'text/html','.css':'text/css'})[path.extname(file)]||'application/octet-stream');
    if(name==='/js/main.js')bytes=Buffer.from(bytes.toString().replace(/\}\)\(\);\s*$/,`globalThis.weaponTest={newGame,draw,drawPlayer,drawCharacterPreview,drawCharacterSelect,openCharacterSelect,fireWeapon,spawnEnemy,update,keys,setScreen:s=>screen=s,get game(){return game}};})();`));
    res.end(bytes);
   });
  });await new Promise(r=>server.listen(0,'127.0.0.1',r));
  await tab.send('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/index.html'});
  await until(()=>ev('typeof weaponTest!=="undefined"&&WeaponSprites.ready()&&NopalSprite.status().ready&&RosaSprite.status().ready&&BentoSprite.status().ready&&IrisSprite.status().ready'),'HTTP assets');
  await ev('requestAnimationFrame=()=>{}');await sleep(80);
  const result=await ev(`(()=>{
   const f=weaponTest,ids=Object.keys(WeaponAtlas.weapons);let cases=0,bodyChecks=0;
   for(const character of ['nopal','rosa','bento','iris'])for(const id of ids){
    f.newGame(character);f.setScreen('pause');const g=f.game;g.spawn=100;g.nextBoss=Infinity;
    for(const w of Object.values(g.weapons))w.level=0;
    const w=g.weapons[id];w.level=1;w.cool=100;
    const target=f.spawnEnemy('brute');Object.assign(target,{hp:1e9,maxHp:1e9,speed:0});
    for(let dir=0;dir<8;dir++){
     g.time=1+dir;const angle=dir*Math.PI/4;
     target.x=g.player.x+Math.cos(angle)*80;target.y=g.player.y+Math.sin(angle)*80;
     f.fireWeapon(w);g.player.visualDirection=(Math.round(Math.atan2(-Math.cos(angle),Math.sin(angle))/(Math.PI/4))+8)%8;g.player.visualMoving=true;
     if(['revolver','shotgun','solar'].includes(id))for(const shot of g.shots.filter(s=>s.visualBorn===g.time)){
      const distance=Math.hypot(shot.x-g.player.x,shot.y-g.player.y);
      if(Math.abs(distance-(id==='solar'?15:13))>1e-8)throw Error('projectile gameplay origin changed');
     }
     if(id==='dynamite')g.player.weaponAngle=angle;
     const before=JSON.stringify(g),p=g.player;
     const a=WeaponSprites.heldState(p,g.time);
     if(['revolver','shotgun','rain','solar','lasso'].includes(id)&&a.direction!==dir)throw Error('wrong direction '+character+'/'+id+'/'+dir);
     const srcs=[],sizes=[],old=CanvasRenderingContext2D.prototype.drawImage;
     CanvasRenderingContext2D.prototype.drawImage=function(image,...args){srcs.push(image.src||'canvas');if(image.src?.includes('/weapons_8directions.png')){const m=this.getTransform();sizes.push({crop:args.slice(0,4),w:args[6],h:args[7],a:m.a,d:m.d})}return old.call(this,image,...args)};
     try{f.draw()}finally{CanvasRenderingContext2D.prototype.drawImage=old}
     if(srcs.some(s=>s.includes('/characters/')&&!s.includes('/walk_normalized.png')&&!s.includes('/attack_normalized.png')))throw Error('unexpected hero layer');
     if(JSON.stringify(g)!==before)throw Error('drawing mutated gameplay');
     for(const s of sizes){
      const entry=Object.entries(WeaponAtlas.weapons).find(([id,data])=>data.frames.some(frame=>frame.x===s.crop[0]&&frame.y===s.crop[1]));
      if(!entry||Math.max(s.w,s.h)>entry[1].worldSize||s.a!==1||s.d!==1)throw Error('world size/transform '+character+'/'+id+'/'+dir);
     }
     // Every angle uses the same local dimensions at 1x and 2x presentation.
     const ctx=document.querySelector('#game').getContext('2d'),measure=(scale,rest=false)=>{
      const result=[];CanvasRenderingContext2D.prototype.drawImage=function(image,...args){if(image.src?.includes('/weapons_8directions.png')){const m=this.getTransform();result.push([args[6],args[7],m.a,m.d])}return old.call(this,image,...args)};
      try{ctx.save();ctx.scale(scale,scale);f.drawPlayer({...p,...(rest?{attack:0,muzzleFlash:0,weaponPose:0}:{}),x:-640,y:-400,visualTime:g.time+(rest?.5:0)});ctx.restore()}finally{CanvasRenderingContext2D.prototype.drawImage=old}
      return result;
     };
     const one=measure(1),two=measure(2),rest=measure(1,true);
     if(one.length!==two.length)throw Error('presentation changed weapon count');
     for(let i=0;i<one.length;i++)if(one[i][0]!==two[i][0]||one[i][1]!==two[i][1]||two[i][2]!==2||two[i][3]!==2)throw Error('double presentation scale');
     const embeddedRest=WeaponSprites.nativeHand(p,g.time+.5)?.embeddedWeapon===id;
     if(!embeddedRest&&JSON.stringify(one)!==JSON.stringify(rest))throw Error('weapon grew during attack '+character+'/'+id+'/'+dir);
     if(id==='dynamite'&&!srcs.some(s=>s.includes('/weapons_8directions.png')))throw Error('missing bomb');
     const x=p.x;f.keys.add('d');f.setScreen('playing');f.update(.01);f.setScreen('pause');f.keys.clear();if(p.x<=x)throw Error('movement stopped');
     cases++;bodyChecks++;
    }
   }
   return {cases,bodyChecks};
  })()`);
  assert.equal(result.cases,256);
  const poses=await ev(`(()=>{
   const f=weaponTest,dirs=[['s'],['s','a'],['a'],['w','a'],['w'],['w','d'],['d'],['s','d']];let count=0;
   for(const id of ['nopal','rosa','bento','iris'])for(let dir=0;dir<8;dir++){
    f.newGame(id);f.setScreen('pause');const g=f.game,p=g.player;g.spawn=100;g.nextBoss=Infinity;
    for(const w of Object.values(g.weapons))w.cool=100;
    for(const key of dirs[dir])f.keys.add(key);f.setScreen('playing');f.update(.01);f.setScreen('pause');
    if(!p.visualMoving||p.visualDirection!==dir)throw Error('walk direction '+id+'/'+dir);
    for(let col=0;col<6;col++){
     p.visualWalkTime=(col+.1)/10;
     f.drawPlayer({...p,visualTime:g.time});count++;
    }
    f.keys.clear();f.setScreen('playing');f.update(.01);f.setScreen('pause');if(p.visualMoving)throw Error('stop');
    f.drawPlayer({...p,visualTime:g.time});count++;
    const angle=(dir+2)*Math.PI/4;Object.assign(f.spawnEnemy('brute'),{x:p.x+Math.cos(angle)*80,y:p.y+Math.sin(angle)*80,hp:1e8,maxHp:1e8,speed:0});
    const at=g.time;f.fireWeapon(g.weapons[p.startWeapon]);
    for(const age of [0,.04,.12,.24,.34]){
     g.time=at+age;f.drawPlayer({...p,visualTime:g.time});
     p.visualMoving=true;f.drawPlayer({...p,visualTime:g.time});p.visualMoving=false;count+=2;
    }
    if(id==='nopal'&&NopalSprite.pose(p,g.time).shooting)throw Error('shot failed to recover');
    if(id==='iris'&&WeaponSprites.nativeHand(p,g.time).embeddedWeapon!=='lasso')throw Error('missing complete Iris fallback');
   }
   return count;
  })()`);assert.equal(poses,544);
  await ev(`(()=>{
   const ctx=document.querySelector('#game').getContext('2d'),old=CanvasRenderingContext2D.prototype.drawImage;let count=0;
   CanvasRenderingContext2D.prototype.drawImage=function(image,...args){if(image.src?.includes('/weapons_8directions.png')){count++;const m=this.getTransform();if(m.a!==2||m.d!==2)throw Error('selection presentation applied twice')}return old.call(this,image,...args)};
   try{for(const hero of CharacterRoster.list)weaponTest.drawCharacterPreview(hero,200,200,2,5)}finally{CanvasRenderingContext2D.prototype.drawImage=old}
   if(count!==0)throw Error('starter weapons must not be drawn over complete hero frames in selection');
   weaponTest.openCharacterSelect();weaponTest.drawCharacterSelect();document.querySelector('#toast').style.display='none';
  })()`);await capture('weapons-selection');
  // Real Canvas gallery makes every crop, pivot and scale reviewable.
  await ev(`(()=>{
   weaponTest.setScreen('pause');const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
   document.querySelector('#toast').style.display='none';ctx.setTransform(1,0,0,1,0,0);ctx.textAlign='left';ctx.globalAlpha=1;
   ctx.fillStyle='#252b32';ctx.fillRect(0,0,1280,800);ctx.font='13px monospace';
   Object.keys(WeaponAtlas.weapons).forEach((id,row)=>{ctx.fillStyle='#f0d6a4';ctx.fillText(id,12,60+row*92);for(let dir=0;dir<8;dir++){const x=175+dir*140,y=55+row*92;ctx.save();ctx.translate(x,y);ctx.scale(2,2);WeaponSprites.draw(ctx,id,0,0,dir*Math.PI/4);ctx.restore();ctx.fillStyle='#e96b57';ctx.fillRect(x-1,y-1,2,2)}});
  })()`);await capture('weapons-directions');
  await ev(`(()=>{
   const ctx=document.querySelector('#game').getContext('2d');ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#252b32';ctx.fillRect(0,0,1280,800);ctx.textAlign='left';
   ['nopal','rosa','bento','iris'].forEach((id,row)=>{
    ctx.fillStyle='#f0d6a4';ctx.fillText(id,12,80+row*190);
    for(let dir=0;dir<8;dir++){
     const weapon=CharacterRoster.get(id).weapon,p={characterId:id,startWeapon:weapon,heldWeapon:weapon,weaponAngle:dir*Math.PI/4,facing:dir>2&&dir<6?-1:1,visualDirection:(dir+6)%8,visualMoving:true,nopalWalkTime:.2,irisWalkTime:.2,visualStride:1};
     ctx.save();ctx.translate(175+dir*140,110+row*190);ctx.scale(2,2);
     const a=WeaponSprites.heldState(p,5);if(a.behind)WeaponSprites.held(ctx,p,0,0,5);CactusHero.draw(ctx,p,0,0,5);if(!a.behind)WeaponSprites.held(ctx,p,0,0,5);ctx.restore();
    }
   });
  })()`);await capture('weapons-characters');
  await ev(`weaponTest.newGame('nopal');weaponTest.game.time=1;const target=weaponTest.spawnEnemy('brute');Object.assign(target,{x:100,y:70,hp:10000,maxHp:10000});weaponTest.fireWeapon(weaponTest.game.weapons.revolver);weaponTest.draw();weaponTest.setScreen('pause')`);await capture('weapons-nopal-shot');
  assert.deepEqual(errors,[]);
  console.log('PASS Chrome: file root/redirect and HTTP; 256 weapon cases plus 544 idle/walk/attack/recovery poses across 4 heroes/eight directions; fixed sizes, shared 1x/2x presentation, unchanged projectile origins, safe embedded-weapon fallback, pure draws; no console/runtime/network errors.');
 }catch(e){console.error(e.stack);process.exitCode=1}
 finally{if(server)server.close();if(browser){await browser.send('Browser.close').catch(()=>{});browser.socket.close()}if(tab)tab.socket.close()}
})();
