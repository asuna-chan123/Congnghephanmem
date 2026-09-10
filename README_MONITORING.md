# HƯỚNG DẪN VẬN HÀNH HỆ THỐNG ADMIN KỸ THUẬT & GIÁM SÁT DEVOPS / KIỂM ĐỊNH (GRAFANA STACK)

Tài liệu này hướng dẫn quản trị và vận hành hệ thống giám sát hiệu năng, phục vụ cho quá trình vận hành (DevOps) và thu thập số liệu minh chứng cho đồ án môn **Kiểm định chất lượng phần mềm**.

---

## 1. Cổng Dịch Vụ & Địa Chỉ Truy Cập

| Dịch vụ | Địa chỉ truy cập | Tài khoản / Mật khẩu | Mục đích sử dụng |
|---|---|---|---|
| **Website Cho Thuê Thiết Bị** | `http://localhost:3000` | User/Staff hiện có | Giao diện người dùng web chính |
| **Admin Kỹ Thuật (Grafana)** | `http://localhost:3001` | `admin` / `admin` | Giám sát QPS, Latency, CPU, RAM, Loki Logs, QA Testing |
| **Prometheus Metrics Engine** | `http://localhost:9090` | Không yêu cầu | Lưu trữ số liệu thời gian thực, xem cấu hình cào dữ liệu & Alert |
| **Loki Log Engine** | `http://localhost:3100` | Không yêu cầu | Thu thập và lập chỉ mục nhật ký lỗi ứng dụng |
| **Node Exporter** | `http://localhost:9100` | Không yêu cầu | Xuất chỉ số phần cứng máy chủ |

> **Lưu ý quan trọng:** Website bán hàng/thuê thiết bị đang chạy trên cổng `3000`. Do đó, Grafana được phân bổ sang cổng **`3001`** để không gây xung đột cổng.

---

## 2. Phân Biệt Giữa 2 Hệ Thống Admin

Khi thuyết trình đồ án hoặc báo cáo, cần làm rõ 2 hệ thống quản trị:
1. **Admin Kỹ thuật (Technical / DevOps Admin - Grafana tại `:3001`):**
   - Phục vụ kỹ sư hệ thống & kiểm định viên (QA/DevOps).
   - Đo lường lưu lượng (QPS), thời gian phản hồi API (Latency p90/p95/p99), tỷ lệ lỗi HTTP 4xx/5xx, mức tiêu hao RAM/CPU và log chi tiết.
2. **Admin Nghiệp vụ (Business Web Admin):**
   - Phục vụ nhân viên quản lý kinh doanh.
   - Thêm/sửa/xóa sản phẩm laptop, máy ảnh, duyệt hợp đồng thuê thiết bị, nạp tiền ví cọc.

---

## 3. Khởi Chạy Cụm Giám Sát (Docker Compose)

Chỉ cần mở terminal tại thư mục gốc của dự án (`c:\ktclpm\Congnghephanmem`) và chạy:

```powershell
# 1. Khởi động toàn bộ 5 container (Prometheus, Grafana, Loki, Promtail, Node Exporter)
docker compose -f monitoring/docker-compose.monitoring.yml up -d

# 2. Kiểm tra trạng thái hoạt động của các container
docker compose -f monitoring/docker-compose.monitoring.yml ps
```

Khi muốn tắt cụm giám sát:
```powershell
docker compose -f monitoring/docker-compose.monitoring.yml down
```

---

## 4. Các Dashboard Có Sẵn Trên Grafana

Đăng nhập vào `http://localhost:3001` (user: `admin`, pass: `admin`), vào menu **Dashboards** -> chọn thư mục **Tech Rental System**:

### 📊 1. DevOps & Operational Dashboard
- **Mức tiêu hao tài nguyên:** CPU tiến trình Node.js (%), Bộ nhớ RAM (RSS), Uptime máy chủ.
- **Request Rate (QPS):** Biểu đồ lưu lượng truy cập trực tiếp theo từng API endpoint (`/api/products`, `/api/ping`, v.v.).
- **Độ trễ phản hồi (APM Latency):** Đường cong p50 (trung vị), p90, p95, p99.
- **Tỷ lệ lỗi (Error Rate):** Tỷ lệ phần trăm request bị lỗi 4xx/5xx theo thời gian thực.
- **Live Logs (Grafana Loki):** Xem trực tiếp từng dòng log lỗi, mã trạng thái và IP người dùng ngay trên màn hình.

### 🧪 2. QA Testing & Load Test Dashboard (Phục vụ Kiểm định chất lượng)
- **Virtual Users (VUs):** Biểu đồ trực quan số lượng người dùng ảo tăng dần theo thời gian test.
- **Throughput (RPS):** Khả năng xử lý tối đa của hệ thống trước khi chạm ngưỡng nghẽn cổ chai (Bottleneck).
- **Latency Percentiles:** Phân tích độ trễ phản hồi chi tiết p95 & p99 dưới áp lực tải cao.
- **Phân tích điểm nghẽn (API Breakdown):** So sánh tốc độ xử lý giữa các API (API tìm kiếm vs API đặt thuê vs API thanh toán).

---

## 5. Hướng Dẫn Chạy Kịch Bản Kiểm Thử Tải (K6 Load Test)

Kịch bản K6 (`monitoring/k6/load_test.js`) đã được lập trình sẵn để mô phỏng hành vi:
1. Bắt mạch hệ thống (`/api/ping`).
2. Xem danh sách thiết bị và tìm kiếm từ khóa (`laptop`, `camera`, `may_chieu`).
3. Mở xem trang chi tiết thiết bị.
4. Gửi yêu cầu đặt thuê thiết bị (`POST /api/products/1/rent`).

### Cách 1: Chạy nhanh qua Docker (Khuyên dùng - Không cần cài thêm gì)
Chạy script PowerShell dựng sẵn:
```powershell
.\monitoring\k6\run-test.ps1
```

Hoặc tùy chỉnh số lượng người dùng ảo (ví dụ 200 VUs trong 1 phút):
```powershell
.\monitoring\k6\run-test.ps1 -VUs 200 -Duration "1m"
```

### Cách 2: Chạy trực tiếp bằng câu lệnh Docker
```powershell
docker run --rm -i --network=monitoring_monitoring_net -v "${PWD}/monitoring/k6:/scripts" -e TARGET_URL="http://host.docker.internal:3000" -e K6_PROMETHEUS_REMOTE_URL="http://prometheus:9090/api/v1/write" grafana/k6 run -o experimental-prometheus-rw /scripts/load_test.js
```

Trong lúc K6 đang chạy, mở **QA Testing Dashboard** tại `http://localhost:3001` để xem đồ thị nhảy số liệu theo thời gian thực (Real-time).

---

## 6. Hướng Dẫn Điều Tra Lỗi Với Loki (Bug Report Cho Môn QA)

Khi chạy test có xuất hiện lỗi (ví dụ mã HTTP 500 hoặc 404):
1. Vào Grafana -> Chọn tab **Explore** (biểu tượng La bàn bên thanh menu trái).
2. Chọn Data source: **Loki**.
3. Nhập truy vấn LogQL:
   ```logql
   {job="tech-rental-app"} |= "error"
   ```
   hoặc lọc theo mã trạng thái:
   ```logql
   {job="tech-rental-app"} | json | statusCode >= 400
   ```
4. Bạn sẽ thấy ngay timestamp chính xác, URL gây lỗi, mã lỗi và dữ liệu đầu vào. QA có thể copy đoạn log này đính kèm vào **Phiếu báo cáo lỗi (Bug Report)** trong bài thi/báo cáo.

---

## 7. Hướng Dẫn Xuất Báo Cáo / Chụp Ảnh Minh Chứng Đồ Án

Để đưa kết quả kiểm định vào Slide hoặc Báo cáo Word/PDF:
1. Sau khi chạy xong bài Load Test, vào **QA Testing Dashboard**.
2. Chọn khoảng thời gian vừa chạy ở góc trên bên phải (ví dụ: `Last 15 minutes` hoặc `Last 30 minutes`).
3. Click vào góc trên cùng bên phải Dashboard -> Chọn icon **Share** (Chia sẻ).
4. **Cách 1 - Snapshot (Khuyên dùng):** Chọn tab **Snapshot** -> Bấm **Publish to snapshots.raintank.io** hoặc **Local Snapshot**. Bạn sẽ có một đường link lưu vĩnh viễn trạng thái biểu đồ để nộp cho Giảng viên xem trực tiếp.
5. **Cách 2 - Xuất ảnh từng panel:** Nhấp vào tiêu đề của biểu đồ bất kỳ (ví dụ: *Throughput Xử Lý* hoặc *Phân Vị Độ Trễ*) -> Chọn **More** -> **Take snapshot** hoặc chụp màn hình trực tiếp đưa vào tài liệu.
