// Keep HTML script/style URLs in sync with their actual bytes, including file://.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
for(const entry of ['index.html','tools/hero-preview.html']){
 const file=path.join(root,entry),before=fs.readFileSync(file,'utf8');
 const after=before.replace(/\b(src|href)="([^"?#]+\.(?:js|css))(?:\?[^"#]*)?"/g,(match,attr,relative)=>{
  const target=path.resolve(path.dirname(file),relative);
  if(!target.startsWith(root+path.sep))throw Error('Asset outside project: '+relative);
  const hash=crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex').slice(0,12);
  return `${attr}="${relative}?v=${hash}"`;
 });
 if(after!==before)fs.writeFileSync(file,after);
}
console.log('HTML asset versions match file contents.');
