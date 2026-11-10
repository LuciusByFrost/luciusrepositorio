param([string]$Source,[int]$Columns=4,[int]$Rows=4)
Add-Type -AssemblyName System.Drawing
$bmp=[System.Drawing.Bitmap]::FromFile((Resolve-Path $Source))
try {
 $rect=[System.Drawing.Rectangle]::new(0,0,$bmp.Width,$bmp.Height)
 $data=$bmp.LockBits($rect,[System.Drawing.Imaging.ImageLockMode]::ReadOnly,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
 $bytes=[byte[]]::new($data.Stride*$bmp.Height)
 [System.Runtime.InteropServices.Marshal]::Copy($data.Scan0,$bytes,0,$bytes.Length)
 $bmp.UnlockBits($data)
 $zero=0;$partial=0;$opaque=0
 for($i=3;$i -lt $bytes.Length;$i+=4){if($bytes[$i] -eq 0){$zero++}elseif($bytes[$i] -eq 255){$opaque++}else{$partial++}}
 "Source=$Source size=$($bmp.Width)x$($bmp.Height) alpha0=$zero partial=$partial alpha255=$opaque"
 for($row=0;$row -lt $Rows;$row++){for($col=0;$col -lt $Columns;$col++){
  $left=[int][Math]::Floor($col*$bmp.Width/$Columns);$right=[int][Math]::Floor(($col+1)*$bmp.Width/$Columns)
  $top=[int][Math]::Floor($row*$bmp.Height/$Rows);$bottom=[int][Math]::Floor(($row+1)*$bmp.Height/$Rows)
  $x0=$right;$x1=$left;$y0=$bottom;$y1=$top
  for($y=$top;$y -lt $bottom;$y++){for($x=$left;$x -lt $right;$x++){
   if($bytes[$y*$data.Stride+$x*4+3] -gt 16){
    $x0=[Math]::Min($x0,$x);$x1=[Math]::Max($x1,$x);$y0=[Math]::Min($y0,$y);$y1=[Math]::Max($y1,$y)
   }
  }}
  "frame=$($row*$Columns+$col) bounds=$x0,$y0,$x1,$y1"
 }}
} finally {$bmp.Dispose()}
