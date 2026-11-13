// Exercise the actual HTML and renderer in Chrome. Main is exposed only in the
// intercepted HTTP response; production has no debug hooks. Also verifies file://.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');const root=path.resolve(__dirname,'..'),port=Number(process.argv[2]||9236);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label){const end=Date.now()+20000;while(Date.now()<end){if(await fn())return;await sleep(50)}throw Error('Timed out '+label)}
async function connect(url){const socket=new WebSocket(url),pending=new Map();let next=0;await new Promise((r,j)=>{socket.addEventListener('open',r,{once:true});socket.addEventListener('error',j,{once:true})});socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}});return {socket,send(method,params={}){return new Promise((resolve,reject)=>{const id=++next;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}))})}}}
(async()=>{
 let browser,tab;const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!p.startsWith(root+path.sep)){res.writeHead(403);res.end();return}fs.readFile(p,(err,b)=>{if(err){res.writeHead(404);res.end();return}res.setHeader('Content-Type',p.endsWith('.js')?'application/javascript':p.endsWith('.png')?'image/png':p.endsWith('.css')?'text/css':'text/html');res.end(b)})});
 try{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
  const v=await(await fetch('http://127.0.0.1:'+port+'/json/version')).json();browser=await connect(v.webSocketDebuggerUrl);const target=await browser.send('Target.createTarget',{url:'about:blank'}),pages=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();tab=await connect(pages.find(p=>p.id===target.targetId).webSocketDebuggerUrl);
  const errors=[];tab.socket.addEventListener('message',async event=>{const m=JSON.parse(event.data);if(m.method==='Runtime.exceptionThrown'||m.method==='Network.loadingFailed')errors.push(m);if(m.method==='Fetch.requestPaused'){
   const source=fs.readFileSync('js/main.js','utf8').replaceAll('requestAnimationFrame(frame)','void 0').replace(/\}\)\(\);\s*$/,`window.enemyProbe={newGame,update,draw,drawWorld,spawnEnemy,setScreen:s=>screen=s,get game(){return game}};})();`);
   await tab.send('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/javascript'}],body:Buffer.from(source).toString('base64')});
  }});
  await tab.send('Page.enable');await tab.send('Runtime.enable');await tab.send('Network.enable');await tab.send('Fetch.enable',{patterns:[{urlPattern:'*/js/main.js*',requestStage:'Request'}]});
  await tab.send('Page.addScriptToEvaluateOnNewDocument',{source:`window.enemyPNGs=new Set();window.canvasAllocations=0;const create=document.createElement.bind(document);document.createElement=function(tag,...args){if(tag==='canvas')canvasAllocations++;return create(tag,...args)};const draw=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(img,...args){if(img.src?.includes('/normalized.png'))enemyPNGs.add(img.src);return draw.call(this,img,...args)};`});
  async function ev(code){const r=await tab.send('Runtime.evaluate',{expression:'(()=>eval('+JSON.stringify(code)+'))()',returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
  await tab.send('Emulation.setDeviceMetricsOverride',{width:1400,height:900,deviceScaleFactor:1,mobile:false});await tab.send('Page.navigate',{url:base+'/index.html'});
  await until(()=>ev('typeof enemyProbe!=="undefined"&&Object.values(EnemySprites.status()).every(s=>s.state==="ready")&&NopalSprite.isReady()'),'all PNGs');
  const legacySource=fs.readFileSync('js/enemy_sprites.js','utf8').replace("typeof EnemyAtlas==='undefined'?{}:EnemyAtlas",'{}')+';return EnemySprites;';
  await ev('window.legacyEnemies=new Function('+JSON.stringify(legacySource)+')()');
  const report=await ev(`(()=>{
   const P=enemyProbe,N=EnemySprites;P.newGame();const g=P.game;g.spawn=g.nextBoss=1e6;Object.values(g.weapons).forEach(w=>w.level=0);g.player.invuln=1e6;
   const ids=Object.keys(N.profiles),entities=ids.map(id=>P.spawnEnemy(id));g.enemies=entities;const errors=[];let assertions=0;
   const check=(v,m)=>{assertions++;if(!v)errors.push(m)};const alloc=canvasAllocations;
   for(const [index,e] of entities.entries()){
    Object.assign(e,{x:(index%5-2)*210,y:(Math.floor(index/5)-.5)*260,speed:0,hp:1e6,maxHp:1e6});N.track(e,g.time);
    if(e.bossKind==='grave_keeper')continue;
    for(let dir=0;dir<8;dir++){
     const angle=Math.PI/2+dir*Math.PI/4,frames=new Set();
     for(let i=0;i<40;i++){e.x+=Math.cos(angle);e.y+=Math.sin(angle);g.time+=1/60;N.tick(g);const a=N.spritePose(e,g.time);check(a.direction===dir,'direction '+e.type);frames.add(a.column);N.draw(document.querySelector('#game').getContext('2d'),e,300,300,g.time)}check(frames.size===4,'walk frames');
     g.time+=.01;N.tick(g);check(N.spritePose(e,g.time).state==='idle','idle');N.fired(e,g.time,Math.cos(angle),Math.sin(angle));
     for(let i=0;i<4;i++){const a=N.spritePose(e,g.time);check(a.direction===dir&&a.column===4+i,'attack frame');N.draw(document.querySelector('#game').getContext('2d'),e,300,300,g.time);g.time+=.10001;N.tick(g)}check(N.spritePose(e,g.time).state==='idle','attack recovery');
    }
   }
   // Real combat events for all enemies, normal and enraged bosses.
   for(const id of ids)for(const rage of [false,true]){
    P.newGame();const g=P.game;g.spawn=g.nextBoss=1e6;g.player.hp=g.player.maxHp=1e6;Object.values(g.weapons).forEach(w=>w.level=0);const e=P.spawnEnemy(id);Object.assign(e,{x:['gunslinger','boss','iron_colonel','storm_widow','grave_keeper'].includes(id)?300:1,y:0,cd:0,hp:rage?4e5:1e6,maxHp:1e6});let attack=false;
    for(let i=0;i<120;i++){P.update(1/60);attack||=N.spritePose(e,g.time)?.state==='attack'||N.pose(e,g.time).state==='attack';P.draw()}check(attack,'actual attack '+id+'/'+rage);
    const before=JSON.stringify(N.spritePose(e,g.time));P.setScreen('pause');P.update(.5);check(before===JSON.stringify(N.spritePose(e,g.time)),'pause');
   }
   P.newGame();const h=P.game;h.spawn=h.nextBoss=1e6;Object.values(h.weapons).forEach(w=>w.level=0);h.player.invuln=1e6;
   for(let i=0;i<300;i++){const e=P.spawnEnemy(ids[i%6]);Object.assign(e,{x:(i%25-12)*42,y:(Math.floor(i/25)-6)*55,hp:1e6,maxHp:1e6})}
   const start=performance.now();for(let i=0;i<60;i++){P.update(1/60);P.drawWorld()}const ms=(performance.now()-start)/60;
   check(canvasAllocations===alloc,'runtime canvas allocations');
   const snapshot=JSON.stringify(h);P.draw();check(JSON.stringify(h)===snapshot,'render mutated combat');
   const context=document.querySelector('#game').getContext('2d');legacyEnemies.tick(h);
   function measure(renderer){const start=performance.now();for(let i=0;i<30;i++)for(const e of h.enemies)renderer.draw(context,e,700+e.x,450+e.y,h.time);context.getImageData(0,0,1,1);return (performance.now()-start)/30}
   const pngDrawMs=measure(N),proceduralDrawMs=measure(legacyEnemies);
   const realDraw=N.draw;N.draw=legacyEnemies.draw;const oldStart=performance.now();for(let i=0;i<30;i++)P.drawWorld();const proceduralWorldMs=(performance.now()-oldStart)/30;N.draw=realDraw;
   // Gallery in the real world, with player for scale.
   h.enemies=[];ids.forEach((id,i)=>{const e=P.spawnEnemy(id);Object.assign(e,{x:(i%5-2)*210,y:(Math.floor(i/5)-.5)*250,speed:0,hp:e.maxHp*(i>=5?.4:1)});N.track(e,h.time);N.fired(e,h.time,1,0)});N.tick(h);P.draw();
   return {assertions,errors,hordeUpdateAndWorldDrawMs:ms,proceduralWorldMs,pngDrawMs,proceduralDrawMs,canvasAllocations:canvasAllocations-alloc,drawn:[...enemyPNGs],status:N.status(),capture:document.querySelector('#game').toDataURL()};
  })()`);
  fs.writeFileSync('tools/enemies-game.generated.png',Buffer.from(report.capture.split(',')[1],'base64'));delete report.capture;assert.deepEqual(report.errors,[]);assert.equal(report.drawn.length,9);
  await tab.send('Fetch.disable');for(const entry of ['index.html','luciusrepositorio/index.html']){await tab.send('Page.navigate',{url:pathToFileURL(path.join(root,entry)).href});await until(()=>ev('typeof EnemySprites!=="undefined"&&Object.keys(EnemySprites.status()).length===9&&Object.values(EnemySprites.status()).every(s=>s.state==="ready")'),'file:// '+entry);assert(await ev('location.pathname.endsWith("/luciusbyfroty/index.html")'));await ev('window.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter"}));window.dispatchEvent(new KeyboardEvent("keyup",{key:"Enter"}));window.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter"}));window.dispatchEvent(new KeyboardEvent("keyup",{key:"Enter"}))');await sleep(150)}
  assert.deepEqual(errors,[]);fs.writeFileSync('tools/enemies-browser.generated.json',JSON.stringify(report,null,2));console.log('PASS Chrome: '+report.assertions+' assertions; nine PNGs drawn in actual gameplay, ten enemy AIs normal/enraged, eight directions/all walk+attack frames, pause, render purity, zero runtime canvases, HTTP and both file entries. 300-enemy update/world draw: '+report.hordeUpdateAndWorldDrawMs.toFixed(2)+' ms/frame.');
 }catch(e){console.error(e.stack);process.exitCode=1}finally{if(tab)tab.socket.close();if(browser){await browser.send('Browser.close').catch(()=>{});browser.socket.close()}server.close()}
})();
