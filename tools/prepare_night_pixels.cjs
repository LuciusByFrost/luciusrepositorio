const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
module.exports=async({ev})=>{
 const input=process.env.CACTUS_NIGHT_INPUT,source=fs.readFileSync(input),target=path.join(__dirname,'../assets/maps/desert_night.png');
 assert(!fs.existsSync(target),'Preserving existing desert_night.png; inspect it instead of overwriting it.');
 const data='data:image/webp;base64,'+source.toString('base64');
 const result=await ev(`(async()=>{const i=new Image();i.src=${JSON.stringify(data)};await i.decode();const c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(i,0,0);const rgba=g.getImageData(0,0,c.width,c.height).data,png=c.toDataURL('image/png'),roundtrip=new Image();roundtrip.src=png;await roundtrip.decode();g.clearRect(0,0,c.width,c.height);g.drawImage(roundtrip,0,0);const pixels=g.getImageData(0,0,c.width,c.height).data;return {width:c.width,height:c.height,png,pixelsEqual:rgba.every((v,n)=>v===pixels[n])}})()`);
 assert(result.pixelsEqual,'PNG conversion changed decoded pixels');
 const png=Buffer.from(result.png.split(',')[1],'base64');fs.writeFileSync(target,png);
 const rects=[[256,128],[512,128],[768,128],[1024,64],[256,352],[640,352],[896,448],[1152,320]].map(([x,y])=>({x,y,w:192,h:192}));
 const preview=await ev(`(async()=>{const i=new Image();i.src=${JSON.stringify(result.png)};await i.decode();const c=document.createElement('canvas');c.width=768;c.height=424;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#202029';g.fillRect(0,0,c.width,c.height);const rects=${JSON.stringify(rects)};for(let n=0;n<rects.length;n++){const r=rects[n],x=n%4*192,y=Math.floor(n/4)*212;g.drawImage(i,r.x,r.y,192,192,x,y,192,192);g.fillStyle='#fff';g.font='12px monospace';g.fillText(n+': '+r.x+','+r.y,x+6,y+206)}return c.toDataURL('image/png')})()`);
 fs.writeFileSync(path.join(__dirname,'night-ground-candidates.generated.png'),Buffer.from(preview.split(',')[1],'base64'));
 const report={input:path.basename(input),inputSHA256:crypto.createHash('sha256').update(source).digest('hex'),width:result.width,height:result.height,pixelsEqual:result.pixelsEqual,pngSHA256:crypto.createHash('sha256').update(png).digest('hex'),groundCandidates:rects};
 fs.writeFileSync(path.join(__dirname,'night-source.generated.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
};
