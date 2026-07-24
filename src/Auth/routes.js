const express = require('express'); 
const router = express.Router(); 
const authController = require('./controller'); 
const { verifyAction } = require('./util'); 

// Tuyến đường đăng ký
router.post('/register', authController.register); 

// Các tuyến đường đăng nhập và cấp lại token
router.post('/customer/login', authController.customerLogin); 
router.post('/staff/login', authController.staffLogin); 
router.post('/re-auth', authController.reAuth); 

// Route test
router.get('/test-action', verifyAction, (req, res) => { 
    res.status(200).json({ message: "Cho phép thao tác!", user: req.user }); 
}); 

// Tuyến đường Đăng ký & Quên mật khẩu
router.post('/register', authController.register);
router.post('/forgot-password', authController.forgotPassword); // Thêm dòng này

module.exports = router; 