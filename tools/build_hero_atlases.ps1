param([ValidateSet('walk','attack')][string[]]$States=@('walk','attack'))
# Measure connected artwork, not uniform source cells. Keep the originals intact.
$ErrorActionPreference='Stop'
& (Join-Path $PSScriptRoot 'measure_hero_sheets.ps1') -States $States
$root=Split-Path $PSScriptRoot -Parent
$measures=Get-Content (Join-Path $PSScriptRoot 'hero-measurements.generated.json') -Raw | ConvertFrom-Json
$names=@{nopal='Nopal';rosa='Rosa';bento='Bento';iris='Iris'}
$heights=@{nopal=60;rosa=62;bento=60;iris=64}
$starters=@{nopal='revolver';rosa='shotgun';bento='dynamite';iris='lasso'}
foreach($id in @('nopal','rosa','bento','iris')){
 $meta=[ordered]@{version=2;characterId=$id;basePath="../assets/characters/$id/";starterWeapon=$starters[$id];worldFeetY=22;worldBodyHeight=$heights[$id];pivot=@(64,88);directions=@('down','down-left','left','up-left','up','up-right','right','down-right');images=[ordered]@{};walk=$null;attack=$null}
 if($States.Count -lt 2){
  $oldJson=& node -e "const fs=require('fs'),vm=require('vm');process.stdout.write(JSON.stringify(vm.runInNewContext(fs.readFileSync(process.argv[1],'utf8')+';'+process.argv[2])))" (Join-Path $root "assets/characters/$id/atlas.js") "$($names[$id])Atlas"
  if($LASTEXITCODE -ne 0){throw 'Cannot load existing atlas for partial rebuild'}
  $old=$oldJson | ConvertFrom-Json
  foreach($preserved in @('walk','attack')){if($preserved -notin $States){$meta[$preserved]=$old.$preserved;$meta.images[$preserved]=$old.images.$preserved}}
 }
 foreach($state in $States){
  $src="assets/characters/$id/${id}_${state}.png";$data=$measures."${id}_${state}";$cols=if($state -eq 'walk'){6}else{4}
  $b=[Drawing.Bitmap]::FromFile((Join-Path $root $src));$frames=@()
  try{
   # Assign detached sparks, rope loops and tails to the closest measured body.
   $boxes=@($data.frames | ForEach-Object { @{x=$_.x;y=$_.y;right=$_.x+$_.w;bottom=$_.y+$_.h} })
   foreach($part in $data.small){
    $best=-1;$distance=[double]::PositiveInfinity
    for($i=0;$i -lt $data.frames.Count;$i++){
     $f=$data.frames[$i];$dx=[Math]::Max(0,[Math]::Max($f.x-($part.x+$part.w),$part.x-($f.x+$f.w)));$dy=[Math]::Max(0,[Math]::Max($f.y-($part.y+$part.h),$part.y-($f.y+$f.h)))
     $d=$dx*$dx+$dy*$dy
     if($d -lt $distance){$distance=$d;$best=$i}
    }
    if($distance -gt 225){continue} # Disconnected low-alpha generation speckles, not anatomy/effects.
    $box=$boxes[$best];$box.x=[Math]::Min($box.x,$part.x);$box.y=[Math]::Min($box.y,$part.y);$box.right=[Math]::Max($box.right,$part.x+$part.w);$box.bottom=[Math]::Max($box.bottom,$part.y+$part.h)
   }
   for($i=0;$i -lt $data.frames.Count;$i++){
    $f=$data.frames[$i];$box=$boxes[$i]
    # Head center and boot baseline ignore cyan rope, orange flashes and weapon span.
    $head=@();$top=$f.y+$f.h;$feet=0
    # A vertical gun or a detached bomb can extend beyond the body. Require a
    # hat/boot-sized warm run for these attacks, rather than measuring the prop.
    $landmarkWidth=if($state -eq 'attack'){@{nopal=16;rosa=20;bento=24;iris=6}[$id]}else{6}
    for($y=$f.y;$y -lt $f.y+$f.h;$y++){
     $xs=@()
     for($x=$f.x;$x -lt $f.x+$f.w;$x++){
      $c=$b.GetPixel($x,$y)
      $body=$c.A -ge 128 -and $c.R -ge $c.G*1.025 -and $c.G -ge $c.B*1.025 -and -not($c.R -gt $c.G*1.65 -and $c.R -gt 160)
      if($body){$xs+=$x}
     }
     if($xs.Count -ge $landmarkWidth){
      $top=[Math]::Min($top,$y)
      if($y -lt $top+24){$head+=[double](($xs[0]+$xs[-1])/2)}
      if($y -gt $f.y+$f.h*.65){$feet=$y+1}
     }
    }
    if(!$head.Count -or !$feet){throw "Cannot find body landmarks: $id/$state/$i"}
    $head=@($head | Sort-Object);$anchorX=[int][Math]::Round($head[[int]($head.Count/2)])
    $left=[Math]::Max(0,$box.x-2);$upper=[Math]::Max(0,$box.y-2);$right=[Math]::Min($b.Width,$box.right+2);$bottom=[Math]::Min($b.Height,$box.bottom+2)
    $frames+=@{sourceRect=@($left,$upper,($right-$left),($bottom-$upper));sourceAnchor=@($anchorX,$feet);bodyTop=$top;bodyHeight=$feet-$top;direction=[int][Math]::Floor($i/$cols);column=$i%$cols}
   }
   $bodyHeights=@($frames.bodyHeight | Sort-Object);$reference=$bodyHeights[[int]($bodyHeights.Count/2)]
   $scale=$heights[$id]/$reference
   $out=New-Object Drawing.Bitmap ($cols*128),1024
   $g=[Drawing.Graphics]::FromImage($out);$g.Clear([Drawing.Color]::Transparent);$g.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::NearestNeighbor;$g.PixelOffsetMode=[Drawing.Drawing2D.PixelOffsetMode]::Half;$g.CompositingMode=[Drawing.Drawing2D.CompositingMode]::SourceCopy
   try{
    for($i=0;$i -lt $frames.Count;$i++){
     $f=$frames[$i];$r=$f.sourceRect;$a=$f.sourceAnchor
     # Per-frame body landmarks absorb source size drift; no weapon-width scaling.
     $s=[double]$heights[$id]/$f.bodyHeight
     $w=[int][Math]::Round($r[2]*$s);$h=[int][Math]::Round($r[3]*$s)
     $dx=64-[int][Math]::Round(($a[0]-$r[0])*$s);$dy=88-[int][Math]::Round(($a[1]-$r[1])*$s)
     if($dx -lt 3 -or $dy -lt 3 -or $dx+$w -gt 125 -or $dy+$h -gt 125){throw "Insufficient atlas margin $id/$state/$i"}
     $cx=($i%$cols)*128;$cy=[int][Math]::Floor($i/$cols)*128
     $g.DrawImage($b,[Drawing.Rectangle]::new($cx+$dx,$cy+$dy,$w,$h),[Drawing.Rectangle]::new($r[0],$r[1],$r[2],$r[3]),[Drawing.GraphicsUnit]::Pixel)
     $f.x=$cx;$f.y=$cy;$f.w=128;$f.h=128;$f.offset=@($dx,$dy);$f.drawSize=@($w,$h);$f.scale=$s;$f.anchor=@(64,88)
    }
    # The runtime uses the baked file, not the source sheet. Its URL must change
    # whenever generated pixels change, without relying on a manual cache token.
    $buffer=New-Object IO.MemoryStream
    $hasher=[Security.Cryptography.SHA256]::Create()
    try{
     $out.Save($buffer,[Drawing.Imaging.ImageFormat]::Png);$bytes=$buffer.ToArray()
     $hash=([BitConverter]::ToString($hasher.ComputeHash($bytes))).Replace('-','').ToLowerInvariant()
     $file="${state}_normalized.$($hash.Substring(0,12)).png"
     [IO.File]::WriteAllBytes((Join-Path $root "assets/characters/$id/$file"),$bytes)
     $meta.images[$state]=[ordered]@{file=$file;size=@($out.Width,$out.Height);sha256=$hash}
    }finally{$hasher.Dispose();$buffer.Dispose()}
   }finally{$g.Dispose();$out.Dispose()}
   $meta[$state]=@{source=$src;sourceSize=@($b.Width,$b.Height);sourceSHA256=(Get-FileHash (Join-Path $root $src)).Hash;columns=$cols;fps=$(if($state -eq 'walk'){10}else{12.5});rowMap=@(0,1,2,3,4,5,6,7);idleColumns=@(0,0,0,0,0,0,0,0);referenceBodyHeight=$reference;frames=$frames}
  }finally{$b.Dispose()}
 }
 [IO.File]::WriteAllText((Join-Path $root "assets/characters/$id/atlas.js"),"/* Generated by tools/build_hero_atlases.ps1; measured source crops and body landmarks. */`nconst $($names[$id])Atlas = " + ($meta | ConvertTo-Json -Depth 12) + ";`n")
 "$id : rebuilt $($States -join ', '), body $($heights[$id])px, feet (64,88)."
}
& node (Join-Path $PSScriptRoot 'version_game_assets.cjs')
if($LASTEXITCODE -ne 0){throw 'Cannot refresh HTML asset versions'}

