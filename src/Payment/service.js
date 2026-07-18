const { get, query } = require('../models/db');

// 1. Tạo giao dịch NẠP TIỀN
const createDeposit = async (userId, amount) => {
    if (!amount || amount <= 0) throw new Error("Số tiền không hợp lệ.");

    // Kiểm tra và cập nhật ví
    const wallet = await get('SELECT id FROM wallets WHERE user_id = ?', [userId]);
    if (!wallet) {
        await query('INSERT INTO wallets (user_id, balance) VALUES (?, ?)', [userId, amount]);
    } else {
        await query('UPDATE wallets SET balance = balance + ? WHERE user_id = ?', [amount, userId]);
    }

    // Ghi lại lịch sử giao dịch
    await query(
        'INSERT INTO transactions (user_id, type, amount, status) VALUES (?, ?, ?, ?)',
        [userId, 'DEPOSIT', amount, 'COMPLETED']
    );

    return { message: "Nạp tiền thành công." };
};

// 2. Tạo giao dịch RÚT TIỀN
const createWithdrawal = async (userId, amount) => {
    if (!amount || amount <= 0) throw new Error("Số tiền không hợp lệ.");

    // Kiểm tra số dư hiện tại
    const wallet = await get('SELECT balance FROM wallets WHERE user_id = ?', [userId]);
    if (!wallet || wallet.balance < amount) {
        throw new Error("Số dư không đủ để rút tiền.");
    }

    // Trừ tiền trong ví
    await query('UPDATE wallets SET balance = balance - ? WHERE user_id = ?', [amount, userId]);

    // Ghi lại lịch sử giao dịch
    await query(
        'INSERT INTO transactions (user_id, type, amount, status) VALUES (?, ?, ?, ?)',
        [userId, 'WITHDRAWAL', amount, 'COMPLETED']
    );

    return { message: "Rút tiền thành công." };
};

// 3. Xem lịch sử giao dịch cá nhân
const getTransactionHistory = async (userId) => {
    // Lấy toàn bộ lịch sử của user, sắp xếp mới nhất lên đầu
    const history = await query(
        'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC', 
        [userId]
    );
    return history;
};

// =========================================
// CÁC HÀM QUẢN LÝ (Dành cho chức năng Admin)
// =========================================

const getPendingTransactions = async () => {
    return await query('SELECT * FROM transactions WHERE status = "PENDING"');
};

const getTransactionStatus = async (transactionId) => {
    const txn = await get('SELECT * FROM transactions WHERE id = ?', [transactionId]);
    if (!txn) throw new Error("Không tìm thấy giao dịch.");
    return txn;
};

const processTransaction = async (transactionId, action) => {
    // Cập nhật trạng thái giao dịch (APPROVE hoặc REJECT)
    const newStatus = action === 'APPROVE' ? 'COMPLETED' : 'FAILED';
    await query('UPDATE transactions SET status = ? WHERE id = ?', [newStatus, transactionId]);
    return { message: `Giao dịch đã chuyển sang trạng thái: ${newStatus}` };
};

module.exports = {
    createDeposit,
    createWithdrawal,
    getTransactionHistory,
    getPendingTransactions,
    getTransactionStatus,
    processTransaction
};