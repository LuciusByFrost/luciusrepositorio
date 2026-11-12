param([string]$Check='tools/check_heroes_browser.cjs',[int]$Port=9227)
$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
$chromeArgs=@('--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
 '--disable-background-timer-throttling','--disable-renderer-backgrounding',
 "--remote-debugging-port=$Port","--user-data-dir=$env:TEMP/cactus-entrypoint-verification-$Port",'about:blank')
$browser=Start-Process -FilePath 'C:/Program Files/Google/Chrome/Application/chrome.exe' -ArgumentList $chromeArgs -WindowStyle Hidden -PassThru -RedirectStandardOutput "$PSScriptRoot/entrypoints-$Port.generated.out" -RedirectStandardError "$PSScriptRoot/entrypoints-$Port.generated.log"
Push-Location $root
try {
 & node $Check $Port
 if($LASTEXITCODE -ne 0){throw 'Real entry point checks failed'}
}
finally { Pop-Location }
