const { get, query } = require('../models/db'); // Trỏ về file db.js của dự án chính

// 1. Lấy thông tin cá nhân
const getCustomerProfile = async (userId) => {
    // Dùng SELECT để lấy thông tin, nhưng KHÔNG lấy cột password để bảo mật
    const user = await get(
        'SELECT id, phone, role, hoTen, cccd, diaChi, soTaiKhoan, tenNganHang FROM users WHERE id = ?', 
        [userId]
    );

    if (!user) throw new Error("USER_NOT_FOUND");
    return user;
};

// 2. Cập nhật thông tin cá nhân
const updateCustomerProfile = async (userId, updateData) => {
    const { hoTen, cccd, diaChi, soTaiKhoan, tenNganHang } = updateData;

    // Kiểm tra xem user có tồn tại không trước khi update
    const user = await get('SELECT id FROM users WHERE id = ?', [userId]);
    if (!user) throw new Error("USER_NOT_FOUND");

    // Dùng câu lệnh UPDATE để sửa thông tin trong bảng users
    await query(
        `UPDATE users 
         SET hoTen = ?, cccd = ?, diaChi = ?, soTaiKhoan = ?, tenNganHang = ? 
         WHERE id = ?`,
        [hoTen, cccd, diaChi, soTaiKhoan, tenNganHang, userId]
    );

    // Lấy lại thông tin mới nhất sau khi đã cập nhật thành công để trả về cho giao diện
    const updatedUser = await get(
        'SELECT id, phone, role, hoTen, cccd, diaChi, soTaiKhoan, tenNganHang FROM users WHERE id = ?', 
        [userId]
    );

    return updatedUser;
};

module.exports = { getCustomerProfile, updateCustomerProfile };