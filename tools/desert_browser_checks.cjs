const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
module.exports=async({ev,tab})=>{
 let ready=false;for(let i=0;i<100;i++){ready=await ev('DesertBackground.status().state==="ready"&&WeaponSprites.ready()&&Object.values(EnemySprites.status()).every(s=>s.state==="ready")');if(ready)break;await new Promise(r=>setTimeout(r,100))}assert(ready,'background/weapon/enemy assets failed to decode');
 const timings=[];
 for(const [width,height] of [[1280,800],[360,640],[640,360]]){
  await tab.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<700});
  await ev('window.dispatchEvent(new Event("resize"));isacProbe.newGame()');
  for(const [name,x,y] of [['origin',0,0],['chunk-edge',255,256],['negative-corner',-257,-255],['distant',100000,-100000]]){
   // Test-only response instrumentation moves the camera, not production bounds.
   const result=await ev(`(()=>{const c=document.querySelector('#game'),g=c.getContext('2d');isacProbe.setCamera(${x},${y});isacProbe.game.player.x=${x};isacProbe.game.player.y=${y};const samples=[];for(let i=0;i<60;i++){const t=performance.now();DesertBackground.draw(g,{x:${x},y:${y}},c.width,c.height);samples.push(performance.now()-t)}const points=[[0,0],[c.width-1,0],[0,c.height-1],[c.width-1,c.height-1],[c.width>>1,c.height>>1]],opaque=points.every(([x,y])=>g.getImageData(x,y,1,1).data[3]===255);samples.sort((a,b)=>a-b);return {opaque,medianMs:samples[30],p95Ms:samples[57],smoothing:g.imageSmoothingEnabled}})()`);
   assert(result.opaque,'blank area at '+name);assert.equal(result.smoothing,false);
   timings.push({width,height,region:name,...result});
   if(name==='origin'||name==='chunk-edge'){
    const foreground=await ev(`(()=>{const g=isacProbe.game,p=g.player,c=document.querySelector('#game'),ctx=c.getContext('2d');g.enemies=[];const e=isacProbe.spawnEnemy('bandit');Object.assign(e,{x:p.x+90,y:p.y,speed:0});g.gems=[{x:p.x+50,y:p.y+40,r:5,value:1,color:'#65c5e8',bob:0}];g.chests=[ChestSystem.create(p.x-90,p.y+30)];const patches=[[c.width/2+65,c.height/2-45,50,65],[c.width/2+43,c.height/2+33,14,16],[c.width/2-108,c.height/2+12,36,40]],before=patches.map(r=>ctx.getImageData(...r).data.toString());isacProbe.draw();return patches.map((r,i)=>ctx.getImageData(...r).data.toString()!==before[i])})()`);
    assert(foreground.every(Boolean),'enemy, gem or chest failed to render over the background');
    const r=await tab.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(__dirname,`night-terrain-${width}x${height}-${name}.generated.png`),Buffer.from(r.data,'base64'));
   }
  }
 }
 assert(await ev(`(()=>{const c=document.createElement('canvas');c.width=320;c.height=240;const g=c.getContext('2d');for(let i=0;i<30;i++)DesertBackground.draw(g,{x:0,y:0},320,240);const a=new Uint32Array(g.getImageData(0,0,320,240).data.buffer);for(let i=0;i<30;i++)DesertBackground.draw(g,{x:64,y:32},320,240);const b=new Uint32Array(g.getImageData(0,0,320,240).data.buffer);for(let y=0;y<208;y+=4)for(let x=0;x<256;x+=4)if(a[(y+32)*320+x+64]!==b[y*320+x])return false;return true})()`),'camera scroll changed shared world pixels');
 const gameplay=[];
 await tab.send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
 for(const [region,x] of [['origin',0],['chunk-edge',255]]){
  const result=await ev(`new Promise(resolve=>{window.dispatchEvent(new Event('resize'));isacProbe.newGame('nopal','normal');const g=isacProbe.game;g.player.x=${x};g.player.hp=g.player.maxHp=1000000;g.xpNeed=1000000;g.spawn=1000000;g.nextBoss=Infinity;g.nextKnowledgeChest=Infinity;isacProbe.setCamera(${x},0);for(let i=0;i<120;i++){const e=isacProbe.spawnEnemy(i%5?'bandit':'gunslinger'),a=i*Math.PI*2/120;Object.assign(e,{x:g.player.x+Math.cos(a)*320,y:Math.sin(a)*220,hp:1000000,maxHp:1000000})}let frames=0,last=0,start=0;const cpu=[],intervals=[];function frame(now){if(!start)start=now;if(last)intervals.push(now-last);const t=performance.now();isacProbe.update(1/60);isacProbe.draw();cpu.push(performance.now()-t);last=now;if(++frames<60)requestAnimationFrame(frame);else{cpu.sort((a,b)=>a-b);intervals.sort((a,b)=>a-b);resolve({fps:59*1000/(now-start),medianUpdateDrawMs:cpu[30],p95UpdateDrawMs:cpu[57],medianFrameIntervalMs:intervals[29],enemies:g.enemies.length,shots:g.shots.length})}}requestAnimationFrame(frame)})`);
  gameplay.push({region,width:1280,height:800,...result});
 }
 fs.writeFileSync(path.join(__dirname,'night-terrain-performance.generated.json'),JSON.stringify({note:'Background draw-call timings and a 60-frame headless desktop run with 120 enemies/automatic combat; emulated mobile viewports are not physical mobile device measurements.',timings,gameplay},null,2));
};
