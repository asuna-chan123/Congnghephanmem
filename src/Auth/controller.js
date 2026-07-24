const authService = require('./service'); 

const register = async (req, res) => { 
    try { 
        const result = await authService.processRegistration(req.body); 
        
        if (!result.success) { 
            return res.status(400).json({ error: result.error }); 
        } 
        
        return res.status(201).json({  
            message: 'Đăng ký thành công',  
            user: result.user  
        }); 

    } catch (error) { 
        console.error(error); 
        return res.status(500).json({ error: 'Lỗi máy chủ nội bộ' }); 
    } 
}; 

const customerLogin = async (req, res) => { 
    try { 
        const { phone, password } = req.body; 
        const tokens = await authService.loginCustomer(phone, password); 
        res.status(200).json({ message: "Đăng nhập khách hàng thành công", tokens }); 
    } catch (error) { 
        if (error.message === "USER_NOT_FOUND") return res.status(404).json({ message: "Số điện thoại không tồn tại!" }); 
        if (error.message === "INVALID_PASSWORD") return res.status(401).json({ message: "Mật khẩu không đúng!" }); 
        console.error("LỖI LOGIN THỰC TẾ:", error); 
        res.status(500).json({ message: "Lỗi máy chủ nội bộ." }); 
    } 
}; 

const staffLogin = async (req, res) => { 
    try { 
        const { staffId, password } = req.body; 
        const tokens = await authService.loginStaff(staffId, password); 
        res.status(200).json({ message: "Đăng nhập nhân viên thành công", tokens }); 
    } catch (error) { 
        if (error.message === "USER_NOT_FOUND") return res.status(404).json({ message: "Mã nhân viên không tồn tại!" }); 
        if (error.message === "INVALID_PASSWORD") return res.status(401).json({ message: "Mật khẩu không đúng!" }); 
        res.status(500).json({ message: "Lỗi máy chủ nội bộ." }); 
    } 
}; 

const reAuth = async (req, res) => { 
    try { 
        const { refreshToken, password } = req.body; 
        const tokens = await authService.reAuthenticate(refreshToken, password); 
        res.status(200).json({ message: "Xác thực lại thành công", tokens }); 
    } catch (error) { 
        if (error.message === "TOKEN_EXPIRED" || error.message === "NO_TOKEN") { 
            return res.status(403).json({ code: "LOGIN_REQUIRED", message: "Phiên hết hạn, vui lòng đăng nhập lại!" }); 
        } 
        if (error.message === "INVALID_PASSWORD") return res.status(401).json({ message: "Mật khẩu không đúng!" }); 
        res.status(500).json({ message: "Lỗi máy chủ nội bộ." }); 
    } 
}; 

const forgotPassword = async (req, res) => {
    try {
        const { phone, newPassword } = req.body;
        const result = await authService.processForgotPassword(phone, newPassword);
        
        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }
        
        return res.status(200).json({ success: true, message: 'Cập nhật mật khẩu thành công' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }
};

module.exports = { register, customerLogin, staffLogin, reAuth, forgotPassword };