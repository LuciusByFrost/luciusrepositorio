// Real DOM, CSS, assets and game in an isolated Chromium profile. No libraries.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const {spawn}=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),port=Number(process.env.CACTUS_DEBUG_PORT||9243);
const desertCheck=process.env.CACTUS_RENDER_CHECK==='desert';
const prepareNight=process.env.CACTUS_RENDER_CHECK==='prepare-night';
const executable=process.env.CACTUS_BROWSER||[
 'C:/Program Files/Google/Chrome/Application/chrome.exe',
 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
].find(p=>fs.existsSync(p));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function connect(url){
 const ws=new WebSocket(url),pending=new Map();let id=0;
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Browser connection timed out')),5000);ws.addEventListener('open',()=>{clearTimeout(timer);resolve()},{once:true});ws.addEventListener('error',()=>{clearTimeout(timer);reject(Error('Browser connection failed'))},{once:true});ws.addEventListener('close',()=>{clearTimeout(timer);reject(Error('Browser closed before connection'))},{once:true})});
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}}});
 ws.addEventListener('close',()=>{for(const p of pending.values())p.reject(Error('Browser closed during verification'));pending.clear()});
 return {ws,send(method,params={}){return new Promise((resolve,reject)=>{if(ws.readyState!==1){reject(Error('Browser connection is closed'));return}const key=++id,timer=setTimeout(()=>{pending.delete(key);reject(Error('Browser command timed out: '+method))},5000);pending.set(key,{resolve:v=>{clearTimeout(timer);resolve(v)},reject:e=>{clearTimeout(timer);reject(e)}});ws.send(JSON.stringify({id:key,method,params}))})}};
}
(async()=>{
 let child,browser,tab,server,log;
 try{
  assert(executable,'No Chromium browser found. Set CACTUS_BROWSER to its executable.');
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'cactus-isac-check-'));
  log=fs.openSync(path.join(__dirname,desertCheck?'desert-browser.generated.log':'isac-browser.generated.log'),'w');
  child=spawn(executable,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-address=127.0.0.1',`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'about:blank'],{windowsHide:true,stdio:['ignore',log,log]});
  let launchError;child.on('error',e=>launchError=e);
  let version;
  for(let i=0;i<30;i++){
   if(launchError)throw launchError;
   if(child.exitCode!==null)throw Error('Browser exited before rendering; inspect tools/isac-browser.generated.log');
   try{version=await(await fetch(`http://127.0.0.1:${port}/json/version`,{signal:AbortSignal.timeout(500)})).json();break}catch{await wait(200)}
  }
  assert(version,'Browser debugging endpoint unavailable; inspect tools/isac-browser.generated.log');
  browser=await connect(version.webSocketDebuggerUrl);
  server=http.createServer((req,res)=>{
   if(req.url==='/favicon.ico'){res.writeHead(204);res.end();return}
   const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
   if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
   fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);res.end();return}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':'text/html');res.end(data)});
  });await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const target=await browser.send('Target.createTarget',{url:'about:blank'}),pages=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  tab=await connect(pages.find(p=>p.id===target.targetId).webSocketDebuggerUrl);
  const errors=[];
  tab.ws.addEventListener('message',async e=>{const m=JSON.parse(e.data);
   if(m.method==='Runtime.exceptionThrown'||m.method==='Network.loadingFailed'||m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')errors.push(m);
   if(m.method==='Fetch.requestPaused'){
    const source=fs.readFileSync(path.join(root,'js/main.js'),'utf8').replaceAll('requestAnimationFrame(frame)','void 0').replace(/\}\)\(\);\s*$/,`window.isacProbe={newGame,openIsacShop,draw,drawWorld,spawnEnemy,update,setCamera:(x,y)=>{camera.x=x;camera.y=y},interactWithKnowledgeChest,answerKnowledgeQuestion,closeKnowledgePanel,get game(){return game},get screen(){return screen}};})();`);
    await tab.send('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/javascript'}],body:Buffer.from(source).toString('base64')});
   }
  });
  await tab.send('Runtime.enable');await tab.send('Page.enable');await tab.send('Network.enable');await tab.send('Fetch.enable',{patterns:[{urlPattern:'*/js/main.js*',requestStage:'Request'}]});
  async function ev(expression){const r=await tab.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
  if(prepareNight){await require('./prepare_night_pixels.cjs')({ev});return}
  await tab.send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/index.html`});
  let ready=false;for(let i=0;i<100;i++){ready=await ev('typeof isacProbe!=="undefined"&&[NopalSprite,RosaSprite,BentoSprite,IrisSprite].every(s=>s.status().ready)');if(ready)break;await wait(100)}assert(ready,'game and character sprites did not load');
  if(desertCheck)await require('./desert_browser_checks.cjs')({ev,tab});
  else for(const [width,height] of [[1280,800],[360,640],[320,568],[640,360]]){
   await tab.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<700});
   await ev('window.dispatchEvent(new Event("resize"));isacProbe.openIsacShop();isacProbe.draw()');
   assert(await ev('document.querySelector("#isac-panel").scrollWidth<=document.querySelector("#isac-panel").clientWidth'),'shop horizontal overflow');
   await ev(`isacProbe.newGame();isacProbe.game.knowledgeUsed=new Set();isacProbe.game.chests=[KnowledgeChestSystem.create(0,0,1)];isacProbe.interactWithKnowledgeChest();isacProbe.draw()`);
   assert(await ev(`(()=>{const p=document.querySelector('.isac-portrait').getBoundingClientRect(),q=document.querySelector('.isac-question').getBoundingClientRect();return p.right<=q.left&&q.width>150})()`),'portrait must sit to the left of readable question content');
   assert(await ev(`document.querySelectorAll('.isac-answers button').length===4&&document.querySelector('#isac-panel').scrollWidth<=document.querySelector('#isac-panel').clientWidth`));
   await ev(`document.querySelector('.isac-answers button').click();isacProbe.draw()`);
   assert(await ev(`document.querySelector('.isac-explanation').textContent===isacProbe.game.knowledgeQuiz.quiz.question.explanation`));
   const shot=await tab.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(__dirname,`isac-${width}x${height}.generated.png`),Buffer.from(shot.data,'base64'));
  }
  assert.deepEqual(errors,[],'browser asset/JavaScript errors');
  console.log(desertCheck?'PASS browser desert: night source decoded, 1:1 chunk scrolling, stable world pixels, filled distant/negative coordinates, mobile sizes, foreground visibility, screenshots and horde timings; no JavaScript/network errors.':'PASS browser Isac: game assets, shop, quiz left portrait area, four answers, explanation and no horizontal overflow at desktop/mobile/landscape sizes; no JavaScript/network errors. Screenshots saved. Missing approved Isac artwork remains a separate limitation.');
 }catch(e){console.error(e.stack);process.exitCode=1}
 finally{
  if(tab)tab.ws.close();if(browser){await browser.send('Browser.close').catch(()=>{});browser.ws.close()}
  if(child&&child.exitCode===null)child.kill();if(server){server.closeAllConnections();await new Promise(r=>server.close(r))}if(log!==undefined)fs.closeSync(log);
 }
})();
