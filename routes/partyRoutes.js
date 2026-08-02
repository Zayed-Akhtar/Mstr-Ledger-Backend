const express = require('express');
const { getPartyTransactionsByName, getPartyTransactionsByCode, searchParty, createParty, updateParty, deleteParty, getPartyTransactionsDetails } = require('../controllers/partyController');

const router = express.Router();

router.get('/party-transactions/:name', getPartyTransactionsByName);
router.get('/party-by-code/:code', getPartyTransactionsByCode);
router.get('/parties', searchParty);
router.get('/closing-balance/:partyId', getPartyTransactionsDetails);
router.post('/add-party', createParty);
router.put('/update-party/:id', updateParty);
router.delete('/delete-party/:id', deleteParty);

module.exports = router;