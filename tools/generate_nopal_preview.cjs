const fs=require('fs');
for(const id of ['nopal','rosa','player'])fs.writeFileSync('tools/'+id+'-preview.generated.html','<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=hero-preview.html"><a href="hero-preview.html">Preview dos quatro personagens</a>');
console.log('Preview: tools/hero-preview.html');
