const { get, query } = require('../models/db');

// 1. Tạo giao dịch NẠP TIỀN
const createDeposit = async (customerId, amount) => {
    if (!amount || amount <= 0) throw new Error("Số tiền không hợp lệ.");

    // Kiểm tra và cập nhật ví dựa trên customer_id
    const wallet = await get('SELECT id FROM wallets WHERE customer_id = ?', [customerId]);
    if (!wallet) {
        await query('INSERT INTO wallets (customer_id, balance) VALUES (?, ?)', [customerId, amount]);
    } else {
        await query('UPDATE wallets SET balance = balance + ? WHERE customer_id = ?', [amount, customerId]);
    }

    // Ghi lại lịch sử giao dịch
    await query(
        'INSERT INTO transactions (customer_id, type, amount, status) VALUES (?, ?, ?, ?)',
        [customerId, 'DEPOSIT', amount, 'COMPLETED']
    );

    return { message: "Nạp tiền thành công." };
};

// 2. Tạo giao dịch RÚT TIỀN
const createWithdrawal = async (customerId, amount) => {
    if (!amount || amount <= 0) throw new Error("Số tiền không hợp lệ.");

    // Kiểm tra số dư hiện tại
    const wallet = await get('SELECT balance FROM wallets WHERE customer_id = ?', [customerId]);
    if (!wallet || wallet.balance < amount) {
        throw new Error("Số dư không đủ để rút tiền.");
    }

    // Trừ tiền trong ví
    await query('UPDATE wallets SET balance = balance - ? WHERE customer_id = ?', [amount, customerId]);

    // Ghi lại lịch sử giao dịch
    await query(
        'INSERT INTO transactions (customer_id, type, amount, status) VALUES (?, ?, ?, ?)',
        [customerId, 'WITHDRAWAL', amount, 'COMPLETED']
    );

    return { message: "Rút tiền thành công." };
};

// 3. Xem lịch sử giao dịch cá nhân
const getTransactionHistory = async (customerId) => {
    // Lấy toàn bộ lịch sử của khách hàng, sắp xếp mới nhất lên đầu
    const history = await query(
        'SELECT * FROM transactions WHERE customer_id = ? ORDER BY created_at DESC', 
        [customerId]
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
    const newStatus = action === 'APPROVE' ? 'COMPLETED' : 'FAILED';
    await query('UPDATE transactions SET status = ? WHERE id = ?', [newStatus, transactionId]);
    return { message: `Giao dịch đã chuyển sang trạng thái: ${newStatus}` };
};

const getWalletInfo = async (customerId) => {
    const wallet = await get('SELECT balance FROM wallets WHERE customer_id = ?', [customerId]);
    const balance = wallet ? wallet.balance : 0;

    const history = await getTransactionHistory(customerId);

    return { balance, transactions: history };
};

module.exports = {
    createDeposit,
    createWithdrawal,
    getTransactionHistory,
    getPendingTransactions,
    getTransactionStatus,
    processTransaction,
    getWalletInfo
};