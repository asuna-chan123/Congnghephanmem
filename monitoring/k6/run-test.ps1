param (
    [int]$VUs = 0,
    [string]$Duration = "",
    [string]$TargetUrl = "http://host.docker.internal:3000"
)

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  KHOI CHAY KIEM DINH HIEU NANG VA CHIU TAI (LOAD TESTING K6)   " -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Target URL: $TargetUrl" -ForegroundColor Green
Write-Host "Prometheus Remote Write: http://prometheus:9090/api/v1/write" -ForegroundColor Green
Write-Host "Grafana Dashboard: http://localhost:3001" -ForegroundColor Cyan
Write-Host "----------------------------------------------------------------"

$extraArgs = @()
if ($VUs -gt 0) {
    $extraArgs += "--vus"
    $extraArgs += "$VUs"
}
if ($Duration -ne "") {
    $extraArgs += "--duration"
    $extraArgs += "$Duration"
}

$k6Dir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Lay ID mang monitoring_net
$netId = (docker network ls --filter "name=monitoring_net" -q)
if (-not $netId) {
    $netId = "monitoring_monitoring_net"
}

Write-Host "Dang chay kich ban K6 qua Docker container..." -ForegroundColor Yellow

docker run --rm -i `
  --network=$netId `
  -v "${k6Dir}:/scripts" `
  -e TARGET_URL="$TargetUrl" `
  -e K6_PROMETHEUS_RW_SERVER_URL="http://prometheus:9090/api/v1/write" `
  grafana/k6 run -o experimental-prometheus-rw /scripts/load_test.js $extraArgs

Write-Host "----------------------------------------------------------------"
Write-Host "Kiem thu hoan tat! Xem do thi ket qua tai http://localhost:3001" -ForegroundColor Green
