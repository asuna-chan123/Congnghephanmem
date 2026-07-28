const { get, query } = require('../models/db');
const { comparePassword, generateTokens, isValidPassword, hashPassword } = require('./util');
const jwt = require('jsonwebtoken');

const processRegistration = async (data) => {
    // 1. Nhận thêm fullName từ req.body
    const { fullName, phone, password } = data;

    // 2. Kiểm tra điều kiện có cả fullName
    if (!fullName || !phone || !password) {
        return { success: false, error: 'Vui lòng cung cấp đầy đủ họ tên, số điện thoại và mật khẩu.' };
    }

    if (!isValidPassword(password)) {
        return {
            success: false,
            error: 'Mật khẩu phải từ 8-32 ký tự, bao gồm ít nhất 1 chữ cái, 1 chữ số và 1 ký tự đặc biệt hợp lệ.'
        };
    }

    const userExists = await get('SELECT * FROM customers WHERE phone_number = ?', [phone]);
    if (userExists) {
        return { success: false, error: 'Số điện thoại này đã được đăng ký.' };
    }

    const hashed = await hashPassword(password);

    // 3. Cập nhật câu lệnh SQL: Thêm cột full_name và truyền giá trị fullName vào
    await query(
        'INSERT INTO customers (full_name, phone_number, password_hash) VALUES (?, ?, ?)',
        [fullName, phone, hashed]
    );

    const newUser = await get('SELECT customer_id, phone_number FROM customers WHERE phone_number = ?', [phone]);

    return {
        success: true,
        user: { id: newUser.customer_id, phone: newUser.phone_number }
    };
};

const loginCustomer = async (phone, password) => {
    const user = await get('SELECT * FROM customers WHERE phone_number = ?', [phone]);
    if (!user) throw new Error("USER_NOT_FOUND");

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) throw new Error("INVALID_PASSWORD");

    // Gắn cứng role 'customer' vào token để hệ thống ủy quyền (authorization) hoạt động
    return generateTokens({ id: user.customer_id, role: 'customer' }, 'customer');
};

const loginStaff = async (staffPhone, password) => {
    // Tách truy vấn riêng cho nhân viên, tìm trong bảng staff
    const user = await get('SELECT * FROM staff WHERE phone_number = ?', [staffPhone]);
    if (!user) throw new Error("USER_NOT_FOUND");

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) throw new Error("INVALID_PASSWORD");

    const role = user.position_name || 'staff';
    return generateTokens({ id: user.staff_id, role: role }, role);
};

const reAuthenticate = async (refreshToken, password) => {
    if (!refreshToken) throw new Error("NO_TOKEN");

    let decoded;
    try {
        decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
        throw new Error("TOKEN_EXPIRED");
    }

    let user, isMatch;

    // Kiểm tra token thuộc về bảng nào
    if (decoded.role === 'customer') {
        user = await get('SELECT * FROM customers WHERE customer_id = ?', [decoded.id]);
        if (!user) throw new Error("USER_NOT_FOUND");
        isMatch = await comparePassword(password, user.password_hash);
    } else {
        user = await get('SELECT * FROM staff WHERE staff_id = ?', [decoded.id]);
        if (!user) throw new Error("USER_NOT_FOUND");
        isMatch = await comparePassword(password, user.password_hash);
    }

    if (!isMatch) throw new Error("INVALID_PASSWORD");

    return generateTokens({ id: decoded.id, role: decoded.role }, decoded.role);
};

const processForgotPassword = async (phone, newPassword) => {
    if (!phone || !newPassword) {
        return { success: false, error: 'Vui lòng cung cấp số điện thoại và mật khẩu mới.' };
    }

    if (!isValidPassword(newPassword)) {
        return {
            success: false,
            error: 'Mật khẩu phải từ 8-32 ký tự, bao gồm ít nhất 1 chữ cái, 1 chữ số và 1 ký tự đặc biệt hợp lệ.'
        };
    }

    const userExists = await get('SELECT * FROM customers WHERE phone_number = ?', [phone]);
    if (!userExists) {
        return { success: false, error: 'Số điện thoại không tồn tại trong hệ thống.' };
    }

    const hashed = await hashPassword(newPassword);
    await query('UPDATE customers SET password_hash = ? WHERE phone_number = ?', [hashed, phone]);

    return { success: true };
};

module.exports = { processRegistration, loginCustomer, loginStaff, reAuthenticate, processForgotPassword };