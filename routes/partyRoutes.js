const express = require('express');
const { getPartiesByName, getPartyTransactionsById, getPartyTransactionsByCode, searchParty, createParty, updateParty, deleteParty, getPartyTransactionsDetails } = require('../controllers/partyController');
const authenticationMiddleware = require('../middleware/authenticationMiddleware');

const router = express.Router();

router.get('/parties-by-name/:name', authenticationMiddleware, getPartiesByName);
router.get('/party-transactions/:partyId', authenticationMiddleware, getPartyTransactionsById);
router.get('/party-by-code/:code', authenticationMiddleware, getPartyTransactionsByCode);
router.get('/parties', authenticationMiddleware, searchParty);
router.get('/closing-balance/:partyId', authenticationMiddleware, getPartyTransactionsDetails);
router.post('/add-party', authenticationMiddleware, createParty);
router.put('/update-party/:id', authenticationMiddleware, updateParty);
router.delete('/delete-party/:id', authenticationMiddleware, deleteParty);

module.exports = router;