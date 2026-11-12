param([ValidateSet('nopal','rosa')][string]$Character = 'nopal')
$ErrorActionPreference = 'Stop'
# Historical command now captures and checks all four complete-frame heroes.
& (Join-Path $PSScriptRoot 'verify_game_entrypoints.ps1')
