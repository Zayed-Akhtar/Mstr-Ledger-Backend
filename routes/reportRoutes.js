const express = require("express");
const { generateReport, generatePartiesReport } = require("../controllers/reportController");
const authenticationMiddleware = require("../middleware/authenticationMiddleware");

const router = express.Router();

router.post("/generate", authenticationMiddleware, generateReport);
router.post("/generate-parties", authenticationMiddleware, generatePartiesReport);

module.exports = router;
