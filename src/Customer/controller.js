const service = require('./service');

const getProfile = async (req, res) => {
    try {
        const userId = req.user.id; 
        
        // SỬA LỖI: Thêm từ khóa await ở đây
        const data = await service.getCustomerProfile(userId);
        
        return res.status(200).json({ success: true, data: data });
    } catch (error) {
        if (error.message === "USER_NOT_FOUND") {
            return res.status(404).json({ success: false, message: "Không tìm thấy thông tin khách hàng." });
        }
        return res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

// BỔ SUNG: Hàm xử lý cập nhật thông tin
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const updateData = req.body;
        
        const updatedUser = await service.updateCustomerProfile(userId, updateData);
        
        return res.status(200).json({ 
            success: true, 
            message: "Cập nhật thông tin thành công!",
            data: updatedUser 
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

module.exports = { getProfile, updateProfile };