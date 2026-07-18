const bcrypt = require('bcrypt'); //[cite: 9]
const jwt = require('jsonwebtoken'); //[cite: 9]

// Regex kiểm tra mật khẩu[cite: 14]
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*?\/.,:;+=\-_()[\]{}'"~])[A-Za-z\d!@#$%^&*?\/.,:;+=\-_()[\]{}'"~]{8,32}$/; //[cite: 14]

const isValidPassword = (password) => { //[cite: 14]
    return passwordRegex.test(password); //[cite: 14]
}; //[cite: 14]

const hashPassword = async (password) => { //[cite: 9]
    const saltRounds = 10; //[cite: 9]
    return await bcrypt.hash(password, saltRounds); //[cite: 9]
}; //[cite: 9]

const comparePassword = async (password, hashedPassword) => { //[cite: 9]
    return await bcrypt.compare(password, hashedPassword); //[cite: 9]
}; //[cite: 9]

const generateTokens = (userPayload, role) => { //[cite: 9]
    const accessExpiresIn = role === 'customer'  //[cite: 9]
        ? process.env.JWT_ACCESS_EXPIRES_CUSTOMER  //[cite: 9]
        : process.env.JWT_ACCESS_EXPIRES_STAFF; //[cite: 9]

    const accessToken = jwt.sign( //[cite: 9]
        userPayload,  //[cite: 9]
        process.env.JWT_ACCESS_SECRET,  //[cite: 9]
        { expiresIn: accessExpiresIn } //[cite: 9]
    ); //[cite: 9]

    const refreshToken = jwt.sign( //[cite: 9]
        userPayload,  //[cite: 9]
        process.env.JWT_REFRESH_SECRET,  //[cite: 9]
        { expiresIn: process.env.JWT_REFRESH_EXPIRES } //[cite: 9]
    ); //[cite: 9]

    return { accessToken, refreshToken }; //[cite: 9]
}; //[cite: 9]

const verifyAction = (req, res, next) => { //[cite: 9]
    const authHeader = req.headers['authorization']; //[cite: 9]
    const token = authHeader && authHeader.split(' ')[1]; //[cite: 9]

    if (!token) { //[cite: 9]
        return res.status(401).json({ message: "Từ chối truy cập: Không tìm thấy Access Token!" }); //[cite: 9]
    } //[cite: 9]

    try { //[cite: 9]
        req.user = jwt.verify(token, process.env.JWT_ACCESS_SECRET); //[cite: 9]
        next(); //[cite: 9]
    } catch (error) { //[cite: 9]
        return res.status(403).json({  //[cite: 9]
            code: "SUDO_REQUIRED",  //[cite: 9]
            message: "Phiên thao tác đã hết hạn, yêu cầu nhập lại mật khẩu!"  //[cite: 9]
        }); //[cite: 9]
    } //[cite: 9]
}; //[cite: 9]

const verifyBasic = (req, res, next) => { //[cite: 9]
    const authHeader = req.headers['authorization']; //[cite: 9]
    const token = authHeader && authHeader.split(' ')[1]; //[cite: 9]

    if (!token) { //[cite: 9]
        return res.status(401).json({ message: "Từ chối truy cập: Không tìm thấy Refresh Token!" }); //[cite: 9]
    } //[cite: 9]

    try { //[cite: 9]
        req.user = jwt.verify(token, process.env.JWT_REFRESH_SECRET); //[cite: 9]
        next(); //[cite: 9]
    } catch (error) { //[cite: 9]
        return res.status(403).json({  //[cite: 9]
            code: "LOGIN_REQUIRED",  //[cite: 9]
            message: "Phiên làm việc đã kết thúc, vui lòng đăng nhập lại toàn bộ!"  //[cite: 9]
        }); //[cite: 9]
    } //[cite: 9]
}; //[cite: 9]

module.exports = { 
    isValidPassword,
    hashPassword, 
    comparePassword, 
    generateTokens, 
    verifyAction, 
    verifyBasic 
};