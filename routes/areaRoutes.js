const express = require('express');
const { createArea, getAreas, updateArea, deleteArea, searchAreas } = require('../controllers/areaController');

const router = express.Router();

router.get('/areas', getAreas);
router.get('/search', searchAreas);
router.post('/add-area', createArea);
router.put('/update-area/:id', updateArea);
router.delete('/delete-area/:id', deleteArea);

module.exports = router;
