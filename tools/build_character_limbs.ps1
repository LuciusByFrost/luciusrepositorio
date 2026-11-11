$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$root=Split-Path $PSScriptRoot -Parent
function Read-Atlas($path,$name){
 $js="const fs=require('fs'),vm=require('vm');process.stdout.write(JSON.stringify(vm.runInNewContext(fs.readFileSync(process.argv[1],'utf8')+';'+process.argv[2])))"
 return ((& node -e $js (Join-Path $root $path) $name)|ConvertFrom-Json)
}
$weapons=Read-Atlas 'assets/weapons/atlas.js' 'WeaponAtlas'
$characters=[ordered]@{}
$hands=@{
 nopal=@(@(90,120),@(90,117),@(78,130),@(20,120),@(90,118),@(86,110),@(85,110),@(90,116))
 iris=@(@(59,133),@(35,124),@(34,123),@(32,113),@(95,119),@(92,117),@(81,128),@(63,125))
}

foreach($id in @('nopal','iris')){
 $path=if($id -eq 'nopal'){'assets/characters/nopal/walk_atlas.js'}else{'assets/characters/iris/atlas.js'}
 $name=if($id -eq 'nopal'){'NopalWalkAtlas'}else{'IrisAtlas'}
 $data=Read-Atlas $path $name
 $src=[Drawing.Bitmap]::FromFile((Join-Path $root $data.source));$clean=$src.Clone();$frames=@();$restored=0
 try{
  for($i=0;$i -lt 32;$i++){
   $f=$data.frames[$i];$dir=[int][Math]::Floor($i/4);$hand=$hands[$id][$dir]
   # Flattened art cannot safely lose its embedded weapon. Keep every source
   # pixel and suppress a second rendering of that weapon at runtime.
   $protected=@(,@(0,0,$f.w,$f.h))
   $restored+=$f.w*$f.h
   $frames+=@{hand=$hand;protected=$protected}
  }
  $out=if($id -eq 'nopal'){'walk_weaponless.png'}else{'weaponless.png'}
  $clean.Save((Join-Path $root "assets/characters/$id/$out"),[Drawing.Imaging.ImageFormat]::Png)
  $characters[$id]=@{frames=$frames;embeddedWeapon=$(if($id -eq 'nopal'){'revolver'}else{'lasso'})}
  Write-Output "${id}: 32 complete walking frames; $restored protected anatomy pixels checked."
 }finally{$clean.Dispose();$src.Dispose()}
}
foreach($id in @('nopal','rosa')){
 $name=if($id -eq 'nopal'){'NopalAtlas'}else{'RosaAtlas'}
 $data=Read-Atlas "assets/characters/$id/atlas.js" $name
 $src=[Drawing.Bitmap]::FromFile((Join-Path $root "assets/characters/$id/arms.png"))
 $arm=[Drawing.Bitmap]::new($src.Width,$src.Height,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
 $frames=@()
 try{
  for($i=0;$i -lt 16;$i++){
   $f=$data.frames[$i];$radius=if($id -eq 'nopal'){7}else{6}
   # Recover proximal native arm/hand pixels that were removed with the gun.
   # The distal barrel/flash never enters this layer. The remaining receiver is
   # covered at the native grip by the proportional directional gun.
   for($y=0;$y -lt $f.h;$y++){for($x=0;$x -lt $f.w;$x++){
    $proximal=[Math]::Pow($x-$f.shoulder[0],2)+[Math]::Pow($y-$f.shoulder[1],2) -le $radius*$radius
    # Some historical weapon masks also intersect the face/upper torso in the
    # attack row. Restore those authored pixels as anatomy, never erase them.
    $anatomy=($x -ge 18 -and $x -lt 60 -and $y -lt 33) -or ($x -ge 25 -and $x -lt 46 -and $y -ge 33 -and $y -lt 59)
    if($proximal -or $anatomy){$arm.SetPixel($f.x+$x,$f.y+$y,$src.GetPixel($f.x+$x,$f.y+$y))}
   }}
   $offset=if($id -eq 'nopal'){3}else{0}
   $frames+=@{hand=@(($f.shoulder[0]+$offset),$f.shoulder[1]);radius=$radius}
  }
  $arm.Save((Join-Path $root "assets/characters/$id/hands.png"),[Drawing.Imaging.ImageFormat]::Png)
  if($id -eq 'nopal'){$characters.nopal.actions=$frames}else{$characters.rosa=@{actions=$frames}}
  $layer="${id}_hands"
  $weapons.images|Add-Member -NotePropertyName $layer -NotePropertyValue @{file="../characters/$id/hands.png";size=@(384,384)} -Force
  Write-Output "${id}: 16 native arm/hand layers restored without the distal gun."
 }finally{$src.Dispose();$arm.Dispose()}
}
$weapons|Add-Member -NotePropertyName characters -NotePropertyValue $characters -Force
[IO.File]::WriteAllText((Join-Path $root 'assets/weapons/atlas.js'),"/* Measured by tools/build_weapon_atlas.ps1; anatomy restored by tools/build_character_limbs.ps1. */`nconst WeaponAtlas = " + ($weapons|ConvertTo-Json -Depth 14) + ";`n")
