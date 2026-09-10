param (
    [int]$VUs = 0,
    [string]$Duration = "",
    [string]$TargetUrl = "http://host.docker.internal:3000"
)

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  KHỞI CHẠY KIỂM ĐỊNH HIỆU NĂNG VÀ CHỊU TẢI (LOAD TESTING K6)  " -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Mục tiêu: $TargetUrl" -ForegroundColor Green
Write-Host "Stream metrics về: http://prometheus:9090/api/v1/write" -ForegroundColor Green
Write-Host "Grafana Dashboard: http://localhost:3001" -ForegroundColor Cyan
Write-Host "----------------------------------------------------------------"

$extraArgs = @()
if ($VUs -gt 0) {
    $extraArgs += "--vus", $VUs
}
if ($Duration -ne "") {
    $extraArgs += "--duration", $Duration
}

# Lấy đường dẫn tuyệt đối thư mục k6
$k6Dir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Kiểm tra mạng docker
$networkName = "monitoring_monitoring_net"
$netExists = docker network ls --filter name=$networkName -q
if (-not $netExists) {
    $networkName = "host"
}

Write-Host "Đang chạy kịch bản K6 qua container Docker..." -ForegroundColor Yellow

docker run --rm -i `
  --network=$networkName `
  -v "${k6Dir}:/scripts" `
  -e TARGET_URL="$TargetUrl" `
  -e K6_PROMETHEUS_REMOTE_URL="http://prometheus:9090/api/v1/write" `
  grafana/k6 run -o experimental-prometheus-rw /scripts/load_test.js @extraArgs

Write-Host "----------------------------------------------------------------"
Write-Host "Kiểm thử hoàn tất! Xem đồ thị kết quả tại http://localhost:3001" -ForegroundColor Green
