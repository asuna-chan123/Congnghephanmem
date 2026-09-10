$nodeZip = "C:\Users\Khanh\AppData\Local\Temp\node-v20.18.3-win-x64.zip"
$targetDir = "C:\Users\Khanh\nodejs"
$url = "https://nodejs.org/dist/v20.18.3/node-v20.18.3-win-x64.zip"

Write-Host "Downloading Node.js..."
curl.exe -L -o $nodeZip $url

Write-Host "Extracting to $targetDir..."
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}
tar.exe -xf $nodeZip -C $targetDir --strip-components 1

Remove-Item -Force $nodeZip -ErrorAction SilentlyContinue

Write-Host "Configuring PATH..."
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$targetDir*") {
    [Environment]::SetEnvironmentVariable("Path", "$targetDir;$userPath", "User")
}

Write-Host "Verification:"
& "$targetDir\node.exe" -v
& "$targetDir\npm.cmd" -v
