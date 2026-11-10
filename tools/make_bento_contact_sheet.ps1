Add-Type -AssemblyName System.Drawing
$sheet=[System.Drawing.Bitmap]::new(1120,1280)
$g=[System.Drawing.Graphics]::FromImage($sheet)
$g.Clear([System.Drawing.Color]::FromArgb(255,40,45,51))
$g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::Half
$font=[System.Drawing.Font]::new('Consolas',13)
$labels=@('Baixo','Baixo-esq','Esquerda','Cima-esq','Cima','Cima-dir','Direita','Baixo-dir')
try {
 for($i=0;$i -lt 20;$i++){
  # Deterministic atlas poses avoid a screenshot racing the next real throw.
  $name=if($i -lt 16){'walk'}else{'actions'}
  $frame=if($i -lt 8){$i*4+2}elseif($i -lt 16){($i-8)*4}else{8+$i-16}
  $title=if($i -lt 8){"Andando: $($labels[$i])"}elseif($i -lt 16){"Parado: $($labels[$i-8])"}else{@('Preparacao','Lancamento real','Finalizacao','Recuperacao')[$i-16]}
  $image=[System.Drawing.Bitmap]::FromFile((Join-Path $PSScriptRoot "../assets/characters/bento/$name.png"))
  try {
   $x=($i%4)*280;$y=[int][Math]::Floor($i/4)*256
   $g.DrawString($title,$font,[System.Drawing.Brushes]::Wheat,$x+12,$y+10)
   $g.FillRectangle([System.Drawing.Brushes]::DarkSlateGray,$x+36,$y+32,208,220)
   $g.DrawImage($image,[System.Drawing.Rectangle]::new($x+44,$y+45,192,192),[System.Drawing.Rectangle]::new(($frame%4)*96,([int][Math]::Floor($frame/4))*96,96,96),[System.Drawing.GraphicsUnit]::Pixel)
   $g.DrawLine([System.Drawing.Pens]::OliveDrab,$x+44,$y+189,$x+236,$y+189)
  }finally{$image.Dispose()}
 }
 $sheet.Save((Join-Path $PSScriptRoot 'bento-directions.png'),[System.Drawing.Imaging.ImageFormat]::Png)
}finally{$font.Dispose();$g.Dispose();$sheet.Dispose()}
Write-Output 'Saved tools/bento-directions.png: normalized walking, fixed idle and action poses.'
