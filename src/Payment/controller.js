const walletService = require('./service');

const createDeposit = async (req, res) => {
    try {
        const userId = req.user.id; 
        const { amount } = req.body;
        
        // Bổ sung await tại đây
        const result = await walletService.createDeposit(userId, amount);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const createWithdrawal = async (req, res) => {
    try {
        const userId = req.user.id; 
        const { amount } = req.body;
        
        const result = await walletService.createWithdrawal(userId, amount);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const getTransactionHistory = async (req, res) => {
    try {
        const userId = req.user.id; 
        const result = await walletService.getTransactionHistory(userId);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const getWalletInfo = async (req, res) => {
    try {
        const userId = req.user.id; 
        const result = await walletService.getWalletInfo(userId);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi hệ thống." });
    }
};

const processTransaction = async (req, res) => {
    try {
        const { transactionId, action } = req.body;
        const result = await walletService.processTransaction(transactionId, action);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const getTransactionStatus = async (req, res) => {
    try {
        const result = await walletService.getTransactionStatus(req.params.id);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};

const getPendingTransactions = async (req, res) => {
    try {
        const result = await walletService.getPendingTransactions();
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createDeposit,
    createWithdrawal,
    processTransaction,
    getTransactionStatus,
    getPendingTransactions,
    getTransactionHistory,
    getWalletInfo
};