const client = require('prom-client');
const logger = require('../utils/logger');

// Tạo Registry riêng để quản lý các Metrics
const register = new client.Registry();

// Bật các metrics mặc định của Node.js (CPU, Memory, Event Loop, Garbage Collection, v.v.)
client.collectDefaultMetrics({
  register,
  prefix: 'node_',
});

// 1. Tổng số lượng HTTP requests
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests processed',
  labelNames: ['method', 'route', 'status_code'],
});
register.registerMetric(httpRequestCounter);

// 2. Thời gian phản hồi HTTP (Latency Histogram - phục vụ tính p50, p90, p95, p99)
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10], // Buckets từ 10ms đến 10s
});
register.registerMetric(httpRequestDuration);

// 3. Số request đang được xử lý đồng thời (Concurrent In-Flight Requests)
const httpActiveRequests = new client.Gauge({
  name: 'http_active_requests',
  help: 'Number of active HTTP requests currently being processed',
});
register.registerMetric(httpActiveRequests);

// 4. Tổng số lỗi ứng dụng (Error Rate)
const appErrorCounter = new client.Counter({
  name: 'app_errors_total',
  help: 'Total number of errors encountered in the application',
  labelNames: ['type', 'route', 'status_code'],
});
register.registerMetric(appErrorCounter);

// Hàm chuẩn hóa route để tránh bùng nổ cardinality trong Prometheus (ví dụ /api/products/15 -> /api/products/:id)
function normalizePath(url) {
  try {
    const parsed = new URL(url, 'http://localhost');
    let pathname = parsed.pathname;
    // Thay thế các ID số hoặc UUID
    pathname = pathname.replace(/\/[0-9]+(?=\/|$)/g, '/:id');
    pathname = pathname.replace(/\/[0-9a-fA-F-]{36}(?=\/|$)/g, '/:uuid');
    return pathname || '/';
  } catch (e) {
    return url;
  }
}

// Middleware Express
function metricsMiddleware(req, res, next) {
  // Bỏ qua scraping endpoint /metrics và static files ảnh/css/js thông thường nếu muốn giảm nhiễu
  if (req.path === '/metrics' || req.path === '/favicon.ico') {
    return next();
  }

  const start = process.hrtime();
  httpActiveRequests.inc();

  res.on('finish', () => {
    httpActiveRequests.dec();

    const diff = process.hrtime(start);
    const durationInSeconds = diff[0] + diff[1] / 1e9;

    const route = normalizePath(req.originalUrl || req.url);
    const statusCode = res.statusCode.toString();
    const method = req.method;

    // Ghi nhận metrics
    httpRequestCounter.inc({ method, route, status_code: statusCode });
    httpRequestDuration.observe({ method, route, status_code: statusCode }, durationInSeconds);

    // Ghi nhận lỗi nếu status >= 400
    if (res.statusCode >= 400) {
      const errorType = res.statusCode >= 500 ? 'SERVER_ERROR' : 'CLIENT_ERROR';
      appErrorCounter.inc({ type: errorType, route, status_code: statusCode });
      
      logger.warn(`HTTP ${statusCode} on ${method} ${req.originalUrl}`, {
        method,
        url: req.originalUrl,
        route,
        statusCode: res.statusCode,
        durationMs: (durationInSeconds * 1000).toFixed(2),
        ip: req.ip || req.connection.remoteAddress,
      });
    } else {
      logger.info(`HTTP ${statusCode} on ${method} ${req.originalUrl}`, {
        method,
        url: req.originalUrl,
        route,
        statusCode: res.statusCode,
        durationMs: (durationInSeconds * 1000).toFixed(2),
      });
    }
  });

  next();
}

module.exports = {
  register,
  metricsMiddleware,
  httpRequestCounter,
  httpRequestDuration,
  httpActiveRequests,
  appErrorCounter,
};
