const { get, query } = require('../models/db'); //[cite: 8, 13]
const { comparePassword, generateTokens, isValidPassword, hashPassword } = require('./util');
const jwt = require('jsonwebtoken'); //[cite: 8]

const processRegistration = async (data) => { //[cite: 13]
    const { phone, password } = data; //[cite: 13]

    if (!phone || !password) { //[cite: 13]
        return { success: false, error: 'Vui lòng cung cấp đầy đủ số điện thoại và mật khẩu.' }; //[cite: 13]
    } //[cite: 13]

    if (!isValidPassword(password)) { //[cite: 13]
        return {  //[cite: 13]
            success: false,  //[cite: 13]
            error: 'Mật khẩu phải từ 8-32 ký tự, bao gồm ít nhất 1 chữ cái, 1 chữ số và 1 ký tự đặc biệt hợp lệ.'  //[cite: 13]
        }; //[cite: 13]
    } //[cite: 13]

    const userExists = await get('SELECT * FROM users WHERE phone = ?', [phone]); //[cite: 13]
    if (userExists) { //[cite: 13]
        return { success: false, error: 'Số điện thoại này đã được đăng ký.' }; //[cite: 13]
    } //[cite: 13]

    // Sử dụng hàm băm từ util đã gộp thay vì gọi trực tiếp bcrypt như bản cũ để đồng bộ
    const hashed = await hashPassword(password); 

    await query( //[cite: 13]
        'INSERT INTO users (phone, password, role) VALUES (?, ?, ?)',  //[cite: 13]
        [phone, hashed, 'customer'] //[cite: 13]
    ); //[cite: 13]

    const newUser = await get('SELECT id, phone FROM users WHERE phone = ?', [phone]); //[cite: 13]

    return {  //[cite: 13]
        success: true,  //[cite: 13]
        user: { id: newUser.id, phone: newUser.phone }  //[cite: 13]
    }; //[cite: 13]
}; //[cite: 13]

const loginCustomer = async (phone, password) => { //[cite: 8]
    const user = await get('SELECT * FROM users WHERE phone = ?', [phone]); //[cite: 8]
    if (!user) throw new Error("USER_NOT_FOUND"); //[cite: 8]

    const isMatch = await comparePassword(password, user.password); //[cite: 8]
    if (!isMatch) throw new Error("INVALID_PASSWORD"); //[cite: 8]

    return generateTokens({ id: user.id, role: user.role }, user.role); //[cite: 8]
}; //[cite: 8]

const loginStaff = async (staffId, password) => { //[cite: 8]
    const user = await get('SELECT * FROM users WHERE phone = ? AND role != "customer"', [staffId]); //[cite: 8]
    if (!user) throw new Error("USER_NOT_FOUND"); //[cite: 8]

    const isMatch = await comparePassword(password, user.password); //[cite: 8]
    if (!isMatch) throw new Error("INVALID_PASSWORD"); //[cite: 8]

    return generateTokens({ id: user.id, role: user.role }, user.role); //[cite: 8]
}; //[cite: 8]

const reAuthenticate = async (refreshToken, password) => { //[cite: 8]
    if (!refreshToken) throw new Error("NO_TOKEN"); //[cite: 8]

    let decoded; //[cite: 8]
    try { //[cite: 8]
        decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET); //[cite: 8]
    } catch (err) { //[cite: 8]
        throw new Error("TOKEN_EXPIRED"); //[cite: 8]
    } //[cite: 8]

    const user = await get('SELECT * FROM users WHERE id = ?', [decoded.id]); //[cite: 8]
    if (!user) throw new Error("USER_NOT_FOUND"); //[cite: 8]

    const isMatch = await comparePassword(password, user.password); //[cite: 8]
    if (!isMatch) throw new Error("INVALID_PASSWORD"); //[cite: 8]

    return generateTokens({ id: user.id, role: user.role }, user.role); //[cite: 8]
}; //[cite: 8]

module.exports = { processRegistration, loginCustomer, loginStaff, reAuthenticate };