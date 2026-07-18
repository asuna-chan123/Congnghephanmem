const jwt = require('jsonwebtoken');

// Middleware kiểm tra Access Token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: "Truy cập bị từ chối. Thiếu Access Token." });
    }

    const token = authHeader.split(' ')[1];

    try {
        // SỬA Ở ĐÂY: Thêm process.env để lấy đúng chìa khóa từ file .env
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        
        // Gán thông tin user (đặc biệt là ID) vào request để controller sử dụng
        req.user = decoded; 
        
        next();
    } catch (error) {
        return res.status(403).json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn." });
    }
};

// Hàm tiện ích tạo token ảo (Chỉ dùng cho môi trường Dev/Test)
const generateDevToken = (payload) => {
    // Sửa lại để dùng chung chìa khóa của hệ thống
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
};

module.exports = { verifyToken, generateDevToken };