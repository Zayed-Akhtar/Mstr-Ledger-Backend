const express = require('express');
const { createTransaction, deleteTransaction, updateTransaction, getTransactions } = require('../controllers/transactionController');

const router = express.Router();

router.get('/transactions', getTransactions)
router.post('/add-transaction', createTransaction)
router.put('/update-transaction/:id', updateTransaction)
router.delete('/transactions/:id', deleteTransaction)

module.exports = router;