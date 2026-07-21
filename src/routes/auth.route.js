const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/profile', AuthController.getProfile);
router.post('/profile', AuthController.updateProfile);
router.post('/verify-password', AuthController.verifyPassword);

module.exports = router;
