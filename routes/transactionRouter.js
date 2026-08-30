const express = require('express');
const { createTransaction, deleteTransaction, updateTransaction, getTransactions, exportTransactionsPdf } = require('../controllers/transactionController');
const authenticationMiddleware = require('../middleware/authenticationMiddleware');

const router = express.Router();

router.get('/transactions',authenticationMiddleware, getTransactions);
router.post('/add-transaction', authenticationMiddleware, createTransaction);
router.put('/update-transaction/:id', authenticationMiddleware, updateTransaction);
router.delete('/delete-transaction/:id', authenticationMiddleware, deleteTransaction);
router.get("/export-pdf", authenticationMiddleware, exportTransactionsPdf);
module.exports = router;