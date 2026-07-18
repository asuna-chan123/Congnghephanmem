const walletService = require('./service');

const createDeposit = (req, res) => {
    try {
        // Lấy ID thật từ Token (đã được middleware giải mã), không dùng 'user_123' nữa
        const userId = req.user.id; 
        const { amount } = req.body;
        
        const result = walletService.createDeposit(userId, amount);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const processTransaction = (req, res) => {
    try {
        const { transactionId, action } = req.body;
        const result = walletService.processTransaction(transactionId, action);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const getTransactionStatus = (req, res) => {
    try {
        const result = walletService.getTransactionStatus(req.params.id);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};

const getPendingTransactions = (req, res) => {
    const result = walletService.getPendingTransactions();
    res.status(200).json({ success: true, data: result });
};

const getTransactionHistory = (req, res) => {
    try {
        // Lịch sử cũng nên lấy từ người đang đăng nhập để bảo mật
        const userId = req.user.id; 
        const result = walletService.getTransactionHistory(userId);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const createWithdrawal = (req, res) => {
    try {
        // Lấy ID thật từ Token
        const userId = req.user.id; 
        const { amount } = req.body;
        
        const result = walletService.createWithdrawal(userId, amount);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

module.exports = {
    createDeposit,
    createWithdrawal,
    processTransaction,
    getTransactionStatus,
    getPendingTransactions,
    getTransactionHistory
};