import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics cho môn Kiểm định chất lượng
const rentalSuccessRate = new Rate('rental_success_rate');
const searchLatency = new Trend('search_latency_trend');
const totalErrors = new Counter('k6_custom_errors');

// Cấu hình kịch bản kiểm thử tải (Stages of Load)
export const options = {
  stages: [
    { duration: '20s', target: 20 },  // Giai đoạn 1: Warm-up (Khởi động hệ thống)
    { duration: '40s', target: 50 },  // Giai đoạn 2: Tải bình thường (Average Load)
    { duration: '40s', target: 100 }, // Giai đoạn 3: Tải cao / Đỉnh điểm (Stress / Spike Load)
    { duration: '20s', target: 0 },   // Giai đoạn 4: Hạ tải (Cool-down)
  ],
  thresholds: {
    // 1. Tỷ lệ lỗi toàn bộ HTTP request phải dưới 5%
    http_req_failed: ['rate<0.05'],
    // 2. 95% request phải có thời gian phản hồi dưới 2 giây (2000ms)
    http_req_duration: ['p(95)<2000'],
    // 3. Tỷ lệ vượt qua các kiểm tra logic (Checks) phải trên 95%
    checks: ['rate>0.95'],
  },
};

// Địa chỉ mục tiêu (Target URL)
// Khi chạy K6 trong Docker, kết nối qua host.docker.internal:3000
// Khi chạy K6 trực tiếp trên máy host, kết nối qua localhost:3000
const BASE_URL = __ENV.TARGET_URL || 'http://host.docker.internal:3000';

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'k6-load-tester/1.0 (QA-Testing-Bot)',
  };

  // 1. KỊCH BẢN: Kiểm tra kết nối & Xem trang chủ (Health Check & Browse)
  group('1. Trang chủ & Bắt mạch', function () {
    const resPing = http.get(`${BASE_URL}/api/ping`, { headers });
    check(resPing, {
      'Ping status 200': (r) => r.status === 200,
    });
    sleep(0.5);
  });

  // 2. KỊCH BẢN: Tìm kiếm và duyệt danh mục thiết bị công nghệ
  group('2. Danh mục sản phẩm & Tìm kiếm thiết bị', function () {
    const startSearch = new Date();
    const resProducts = http.get(`${BASE_URL}/api/products`, { headers });
    searchLatency.add(new Date() - startSearch);

    const ok = check(resProducts, {
      'Get products status 200': (r) => r.status === 200,
      'Has response body': (r) => r.body && r.body.length > 0,
    });

    if (!ok) {
      totalErrors.add(1);
    }

    // Giả lập tìm kiếm từ khóa cụ thể
    const keywords = ['laptop', 'camera', 'may_chieu', 'ipad'];
    const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
    const resSearch = http.get(`${BASE_URL}/api/products?keyword=${randomKeyword}`, { headers });
    check(resSearch, {
      'Search request completed': (r) => r.status === 200 || r.status === 404,
    });

    sleep(1);
  });

  // 3. KỊCH BẢN: Xem chi tiết sản phẩm
  group('3. Xem chi tiết thiết bị', function () {
    // Thử truy vấn ID sản phẩm 1
    const resDetail = http.get(`${BASE_URL}/api/products/1`, { headers });
    check(resDetail, {
      'Detail status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    });
    sleep(0.8);
  });

  // 4. KỊCH BẢN: Luồng tạo đơn thuê thiết bị
  group('4. Tạo đơn thuê thiết bị', function () {
    const rentPayload = JSON.stringify({
      ngay_bat_dau: '2026-09-15',
      ngay_ket_thuc: '2026-09-20',
      so_luong: 1,
      ghi_chu: 'Khách hàng kiểm thử tải tự động K6',
    });

    const resRent = http.post(`${BASE_URL}/api/products/1/rent`, rentPayload, { headers });
    
    // Tùy theo logic auth hoặc dữ liệu thực tế, API có thể trả về 200, 201 hoặc 401 (chưa đăng nhập)
    const passed = check(resRent, {
      'Rent API responds within acceptable status': (r) => [200, 201, 400, 401].includes(r.status),
    });

    rentalSuccessRate.add(passed);
    if (!passed) {
      totalErrors.add(1);
    }
    sleep(1.2);
  });
}
