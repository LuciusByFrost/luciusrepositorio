// Real HTML/assets over HTTP. A response-only probe exposes the real game API
// and replaces RAF with deterministic stepping; no production debug API.
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
 let browser,tab;const server=http.createServer((req,res)=>{
  const p=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
  if(!p.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
  fs.readFile(p,(error,b)=>{if(error){res.writeHead(404);res.end();return}res.setHeader('Content-Type',p.endsWith('.js')?'application/javascript':p.endsWith('.png')?'image/png':p.endsWith('.css')?'text/css':'text/html');res.end(b)});
 });
 try{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
  const version=await until(async()=>{try{return await(await fetch('http://127.0.0.1:'+port+'/json/version')).json()}catch{return null}},'Chrome startup',45000);browser=await connect(version.webSocketDebuggerUrl);
  const target=await browser.send('Target.createTarget',{url:'about:blank'}),pages=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();
  tab=await connect(pages.find(p=>p.id===target.targetId).webSocketDebuggerUrl);
  const errors=[];tab.socket.addEventListener('message',async e=>{const m=JSON.parse(e.data);
   if(m.method==='Runtime.exceptionThrown'||m.method==='Network.loadingFailed'||m.method==='Runtime.consoleAPICalled'&&['error','warning'].includes(m.params.type))errors.push(m);
   if(m.method==='Fetch.requestPaused'){
    const source=fs.readFileSync(path.join(root,'js/main.js'),'utf8').replaceAll('requestAnimationFrame(frame)','void 0').replace(/\}\)\(\);\s*$/,`window.heroProbe={newGame,update,draw,fireWeapon,spawnEnemy,keys,setScreen:s=>screen=s,get game(){return game}};})();`);
    await tab.send('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/javascript'}],body:Buffer.from(source).toString('base64')});
   }
  });
  await tab.send('Page.enable');await tab.send('Runtime.enable');await tab.send('Network.enable');await tab.send('Fetch.enable',{patterns:[{urlPattern:'*/js/main.js*',requestStage:'Request'}]});
  async function ev(expression){const r=await tab.send('Runtime.evaluate',{expression:'(()=>eval('+JSON.stringify(expression)+'))()',returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
  async function shot(name){
   if(!name.includes('preview')){const data=await ev('heroProbe.draw();document.querySelector("#game").toDataURL("image/png")');const b=Buffer.from(data.split(',')[1],'base64');assert(b.length>10000,'empty game capture '+name);fs.writeFileSync(path.join(__dirname,name),b);return}
   const r=await tab.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync(path.join(__dirname,name),Buffer.from(r.data,'base64'));
  }
  await tab.send('Emulation.setDeviceMetricsOverride',{width:1536,height:1000,deviceScaleFactor:1,mobile:false});
  await tab.send('Page.navigate',{url:base+'/index.html'});
  await until(()=>ev('typeof heroProbe!=="undefined"&&[NopalSprite,RosaSprite,BentoSprite,IrisSprite].every(s=>s.status().ready)&&WeaponSprites.ready()'),'all PNGs');
  assert(await ev('document.querySelector("#game").width>1000&&document.querySelector("#game").height>500'));
  await ev('window.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter"}));heroProbe.draw()');await shot('heroes-selection.generated.png');
  const dirs=[['s'],['s','a'],['a'],['w','a'],['w'],['w','d'],['d'],['s','d']];
  for(const id of ['nopal','rosa','bento','iris']){
   await ev(`heroProbe.newGame('${id}');window.checkSprite=${id[0].toUpperCase()+id.slice(1)}Sprite;window.g=heroProbe.game;g.spawn=10000;g.nextBoss=Infinity;Object.values(g.weapons).forEach(w=>w.cool=1000);g.player.hp=g.player.maxHp=100000;`);
   for(let dir=0;dir<8;dir++){
    const keys=JSON.stringify(dirs[dir]),frames=new Set();
    await ev(`for(const key of ${keys})window.dispatchEvent(new KeyboardEvent('keydown',{key}))`);
    for(let i=0;i<40;i++){const a=await ev('heroProbe.update(1/60);checkSprite.pose(g.player,g.time)');assert.equal(a.direction,dir);assert.equal(a.sheet,'walk');if(!frames.has(a.column))await ev('heroProbe.draw()');frames.add(a.column)}assert.equal(frames.size,6);
    await ev(`for(const key of ${keys})window.dispatchEvent(new KeyboardEvent('keyup',{key}));heroProbe.update(1/60);heroProbe.draw()`);
    let a=await ev('checkSprite.pose(g.player,g.time)');assert.equal(a.direction,dir);assert.equal(a.column,0);assert.equal(a.sheet,'walk');
    const angle=Math.PI/2+dir*Math.PI/4;
    await ev(`g.enemies=[];const e=heroProbe.spawnEnemy('brute');Object.assign(e,{x:g.player.x+Math.cos(${angle})*70,y:g.player.y+Math.sin(${angle})*70,hp:100000,maxHp:100000,speed:0});heroProbe.fireWeapon(g.weapons[g.player.startWeapon]);window.attackStart=g.time;window.startX=g.player.x;for(const key of ${keys})window.dispatchEvent(new KeyboardEvent('keydown',{key}));`);
    await ev('heroProbe.update(.001)');
    for(let col=0;col<4;col++){
     a=await ev('heroProbe.draw();checkSprite.pose(g.player,g.time)');assert.equal(a.sheet,'attack');assert.equal(a.direction,dir);assert.equal(a.column,col);
     if(col===1&&dir===6)await shot('heroes-'+id+'-attack.generated.png');
     await ev('heroProbe.update(.08)');
    }
    await ev('heroProbe.update(.001);heroProbe.draw()');a=await ev('checkSprite.pose(g.player,g.time)');assert.equal(a.sheet,'walk');
    assert(await ev('g.player.visualMoving&&Math.hypot(g.player.x-startX,g.player.y)>0'));
    await ev(`for(const key of ${keys})window.dispatchEvent(new KeyboardEvent('keyup',{key}));heroProbe.update(1/60);heroProbe.draw();g.enemies=[]`);
    a=await ev('checkSprite.pose(g.player,g.time)');assert.equal(a.column,0);assert.equal(a.direction,dir);
   }
   await shot('heroes-'+id+'-game.generated.png');
   assert(await ev('const before=JSON.stringify(g);heroProbe.draw();before===JSON.stringify(g)'));
   assert(await ev('heroProbe.setScreen("pause");const before=g.time;heroProbe.update(.2);before===g.time'));
  }
  await tab.send('Page.navigate',{url:base+'/tools/hero-preview.html'});await until(()=>ev('typeof sprites!=="undefined"&&sprites.every(s=>s.status().ready)'),'preview');await ev('time=.8;paused=true');await sleep(100);
  await tab.send('Emulation.setDeviceMetricsOverride',{width:1576,height:1550,deviceScaleFactor:1,mobile:false});await shot('heroes-preview.generated.png');
  await tab.send('Fetch.disable');
  for(const entry of ['index.html','luciusrepositorio/index.html']){
   await tab.send('Page.navigate',{url:pathToFileURL(path.join(root,entry)).href});
   await until(()=>ev('typeof NopalSprite!=="undefined"&&[NopalSprite,RosaSprite,BentoSprite,IrisSprite].every(s=>s.status().ready)'),'unmodified file entry '+entry);
   await ev('window.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter"}));window.dispatchEvent(new KeyboardEvent("keyup",{key:"Enter"}))');
   await sleep(150);const r=await tab.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});const b=Buffer.from(r.data,'base64');assert(b.length>10000);fs.writeFileSync(path.join(__dirname,entry.startsWith('lucius')?'heroes-redirect.generated.png':'heroes-selection.generated.png'),b);
  }
  assert.deepEqual(errors,[]);
  console.log('PASS Chrome: real selection/game/assets; four heroes × eight directions × six walking/four attack frames; 32 idles; real fireWeapon events; moving attacks, recovery, pause, no runtime/network warnings; animated preview/screenshots.');
 }catch(e){console.error(e.stack);process.exitCode=1}
 finally{if(tab)tab.socket.close();if(browser){await browser.send('Browser.close').catch(()=>{});browser.socket.close()}server.close()}
})();

