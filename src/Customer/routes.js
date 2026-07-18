const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifyToken } = require('./util');

// Route: Lấy thông tin
router.get('/profile', verifyToken, controller.getProfile);

// BỔ SUNG Route: Cập nhật thông tin (Dùng PUT thay vì GET)
router.put('/profile', verifyToken, controller.updateProfile);

module.exports = router;