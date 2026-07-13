const express = require('express');
const { getPartyTransactionsByName, getPartyTransactionsByCode, getAllParty } = require('../controllers/partyController');

const router = express.Router();

router.get('/party-transactions/:name', getPartyTransactionsByName);
router.get('/party-by-code/:code', getPartyTransactionsByCode);
router.get('/parties', getAllParty);
module.exports = router;