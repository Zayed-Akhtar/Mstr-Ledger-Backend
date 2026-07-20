const express = require('express');
const { createTransaction, deleteTransaction, updateTransaction, getTransactions, exportTransactionsPdf } = require('../controllers/transactionController');

const router = express.Router();

router.get('/transactions', getTransactions)
router.post('/add-transaction', createTransaction)
router.put('/update-transaction/:id', updateTransaction)
router.delete('/delete-transaction/:id', deleteTransaction)
router.get("/export-pdf", exportTransactionsPdf);

module.exports = router;