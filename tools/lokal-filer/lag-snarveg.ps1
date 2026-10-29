# Lagar snarvegen «SXI-generatoren (lokal)» på skrivebordet og i Start-menyen.
# Snarvegen opnar SXI-generatoren-lokal.html i eit eige Edge-vindauge utan
# adresselinje, med ein eigen profil som ikkje deler noko med vanleg Edge.
# Vert kalla av «Lag snarveg.cmd». -Mappe lagar berre éin snarveg der (test).
param([string]$Mappe = '')

$ErrorActionPreference = 'Stop'
$her  = Split-Path -Parent $MyInvocation.MyCommand.Path
$html = Join-Path $her 'SXI-generatoren-lokal.html'
$ikon = Join-Path $her 'sxi-lokal.ico'
if (-not (Test-Path $html)) { throw "Fann ikkje $html" }

$edge = $null
try { $edge = (Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe').'(default)' } catch {}
if (-not $edge -or -not (Test-Path $edge)) {
  $edge = @("${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
            "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe") |
          Where-Object { Test-Path $_ } | Select-Object -First 1
}
if (-not $edge) { throw 'Fann ikkje Microsoft Edge på denne maskina.' }

# Eigen profil: autolagringa ligg her og ikkje i Edge-profilen til brukaren.
# Ingen synkronisering og ingen bakgrunnstrafikk frå sjølve nettlesaren.
$profil = Join-Path $env:LOCALAPPDATA 'SXI-generatoren-lokal'
$url    = ([Uri]$html).AbsoluteUri
$arg    = "--app=`"$url`" --user-data-dir=`"$profil`" --no-first-run " +
          "--no-default-browser-check --disable-sync --disable-background-networking"

$mapper = if ($Mappe) { @($Mappe) } else {
  @([Environment]::GetFolderPath('Desktop'), [Environment]::GetFolderPath('Programs'))
}
$sh = New-Object -ComObject WScript.Shell
foreach ($m in $mapper) {
  $lnk = $sh.CreateShortcut((Join-Path $m 'SXI-generatoren (lokal).lnk'))
  $lnk.TargetPath       = $edge
  $lnk.Arguments        = $arg
  $lnk.WorkingDirectory = $her
  $lnk.IconLocation     = "$ikon,0"
  $lnk.Description      = 'SXI-generatoren, lokal versjon utan nettilgang'
  $lnk.Save()
  Write-Host "Snarveg laga: $(Join-Path $m 'SXI-generatoren (lokal).lnk')"
}
