const express = require("express");

const {
    signup,
    login,
    logout,
    getCurrentUser
} = require("../controllers/authenticationController");

const authenticationMiddleware =
    require("../middleware/authenticationMiddleware");

const router = express.Router();


router.post("/signup", signup);

router.post("/login", login);

router.post("/logout", logout);

router.get(
    "/me",
    authenticationMiddleware,
    getCurrentUser
);


module.exports = router;