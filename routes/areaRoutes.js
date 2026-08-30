const express = require('express');
const { createArea, getAreas, updateArea, deleteArea, searchAreas } = require('../controllers/areaController');
const authenticationMiddleware = require('../middleware/authenticationMiddleware');

const router = express.Router();

router.get('/areas',authenticationMiddleware,  getAreas);
router.get('/search',authenticationMiddleware,  searchAreas);
router.post('/add-area', authenticationMiddleware, createArea);
router.put('/update-area/:id', authenticationMiddleware, updateArea);
router.delete('/delete-area/:id', authenticationMiddleware, deleteArea);

module.exports = router;
