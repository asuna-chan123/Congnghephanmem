const { get, query } = require('../models/db');

// 1. Lấy thông tin cá nhân
const getCustomerProfile = async (userId) => {
    const user = await get(
        `SELECT 
            customer_id AS id, 
            phone_number AS phone, 
            'customer' AS role,
            full_name AS "hoTen", 
            identity_number AS cccd, 
            address AS "diaChi", 
            bank_account_number AS "soTaiKhoan", 
            bank_name AS "tenNganHang",
            identity_image_front AS "cccdTruoc", 
            identity_image_back AS "cccdSau"
         FROM customers 
         WHERE customer_id = ?`, 
        [userId]
    );

    if (!user) throw new Error("USER_NOT_FOUND");
    return user;
};

// 2. Cập nhật thông tin cá nhân
const updateCustomerProfile = async (userId, updateData) => {
    const { hoTen, cccd, diaChi, soTaiKhoan, tenNganHang, cccdTruoc, cccdSau } = updateData;

    const user = await get('SELECT customer_id FROM customers WHERE customer_id = ?', [userId]);
    if (!user) throw new Error("USER_NOT_FOUND");

    await query(
        `UPDATE customers 
         SET full_name = ?, identity_number = ?, address = ?, bank_account_number = ?, bank_name = ?, identity_image_front = ?, identity_image_back = ? 
         WHERE customer_id = ?`,
        [hoTen, cccd, diaChi, soTaiKhoan, tenNganHang, cccdTruoc, cccdSau, userId]
    );

    const updatedUser = await get(
        `SELECT 
            customer_id AS id, 
            phone_number AS phone, 
            'customer' AS role,
            full_name AS "hoTen", 
            identity_number AS cccd, 
            address AS "diaChi", 
            bank_account_number AS "soTaiKhoan", 
            bank_name AS "tenNganHang",
            identity_image_front AS "cccdTruoc", 
            identity_image_back AS "cccdSau"
         FROM customers 
         WHERE customer_id = ?`, 
        [userId]
    );

    return updatedUser;
};

module.exports = { getCustomerProfile, updateCustomerProfile };