# Spør etter API-nøkkelen (vert ikkje vist eller lagra) og køyrer tools/ki-eval.py.
#   .\tools\ki-eval.ps1 --utval 5 --tag fyrste5
# Nøkkelen gjeld berre denne terminalen. Er $env:ANTHROPIC_API_KEY alt sett, vert han brukt.
if (-not $env:ANTHROPIC_API_KEY) {
  $s = Read-Host 'Anthropic API-nøkkel (vert ikkje vist)' -AsSecureString
  $env:ANTHROPIC_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s))
}
python -X utf8 (Join-Path $PSScriptRoot 'ki-eval.py') @args
