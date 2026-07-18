const express = require('express');
const routes = require('./routes'); // Import file routes.js của riêng module này

// Sử dụng Router thay vì khởi tạo lại một App mới
const router = express.Router();

// Không cần khai báo lại express.json() hay cors() ở đây nữa 
// vì src/app.js đã làm giúp rồi.

// Gắn toàn bộ tuyến đường của module vào gốc (Tiền tố url sẽ do src/app.js quyết định)
router.use('/', routes);

module.exports = router;