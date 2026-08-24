const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/user-model");


/**
 * Generate JWT
 */
const generateToken = (userId) => {
    return jwt.sign(
        {
            userId
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );
};


/**
 * Set authentication cookie
 */
const setAuthCookie = (res, token) => {

    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite:
            process.env.NODE_ENV === "production"
                ? "none"
                : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
};


/**
 * Remove authentication cookie
 */
const clearAuthCookie = (res) => {

    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite:
            process.env.NODE_ENV === "production"
                ? "none"
                : "lax"
    });
};


/**
 * ============================
 * SIGNUP
 * ============================
 */
const signup = async (req, res) => {
console.log('reached signup', req.body);

    try {

        const {
            fullname,
            email,
            password,
            phoneNumber
        } = req.body;


        // -------------------------
        // Validate required fields
        // -------------------------

        if (
            !fullname ||
            !email ||
            !password       
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }


        // -------------------------
        // Normalize email
        // -------------------------

        const normalizedEmail = email
            .trim()
            .toLowerCase();


        // -------------------------
        // Check existing user
        // -------------------------

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {

            return res.status(409).json({
                success: false,
                message: "An account with this email already exists"
            });

        }


        // -------------------------
        // Validate password
        // -------------------------

        if (password.length < 6) {

            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long"
            });

        }


        // -------------------------
        // Hash password
        // -------------------------

        const salt = await bcrypt.genSalt(12);

        const hashedPassword = await bcrypt.hash(
            password,
            salt
        );


        // -------------------------
        // Create user
        // -------------------------

        const user = await User.create({

            fullname: fullname.trim(),

            email: normalizedEmail,

            password: hashedPassword,

            phoneNumber: phoneNumber.trim()

        });


        // -------------------------
        // Generate JWT
        // -------------------------

        const token = generateToken(user._id);


        // -------------------------
        // Set cookie
        // -------------------------

        setAuthCookie(res, token);


        // -------------------------
        // Response
        // -------------------------

        return res.status(201).json({

            success: true,

            message: "Account created successfully",

            user: {
                id: user._id,
                fullname: user.fullname,
                email: user.email,
                phoneNumber: user.phoneNumber
            }

        });

    } catch (error) {

    console.error("Signup Error:", error);

    if (error.code === 11000) {
        return res.status(409).json({
            success: false,
            message: "An account with this email already exists"
        });
    }

    return res.status(500).json({
        success: false,
        message: "Something went wrong while creating your account"
    });
}
};


/**
 * ============================
 * LOGIN
 * ============================
 */
const login = async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        // -------------------------
        // Validate input
        // -------------------------

        if (!email || !password) {

            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });

        }


        // -------------------------
        // Normalize email
        // -------------------------

        const normalizedEmail = email
            .trim()
            .toLowerCase();


        // -------------------------
        // Find user
        // -------------------------

        const user = await User.findOne({
            email: normalizedEmail
        });


        if (!user) {

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });

        }


        // -------------------------
        // Compare password
        // -------------------------

        const isPasswordValid =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!isPasswordValid) {

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });

        }


        // -------------------------
        // Generate JWT
        // -------------------------

        const token = generateToken(user._id);


        // -------------------------
        // Set cookie
        // -------------------------

        setAuthCookie(res, token);


        // -------------------------
        // Response
        // -------------------------

        return res.status(200).json({

            success: true,

            message: "Login successful",

            user: {
                id: user._id,
                fullname: user.fullname,
                email: user.email,
                phoneNumber: user.phoneNumber
            }

        });

    } catch (error) {

        console.error("Login Error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong while logging in"
        });

    }
};


/**
 * ============================
 * LOGOUT
 * ============================
 */
const logout = async (req, res) => {

    try {

        clearAuthCookie(res);

        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });

    } catch (error) {

        console.error("Logout Error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong while logging out"
        });

    }
};


/**
 * ============================
 * GET CURRENT USER
 * ============================
 */
const getCurrentUser = async (req, res) => {

    try {

        const user = await User.findById(req.user.userId)
            .select("-password");

        if (!user) {

            return res.status(404).json({
                success: false,
                message: "User not found"
            });

        }

        return res.status(200).json({

            success: true,

            user

        });

    } catch (error) {

        console.error("Get Current User Error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });

    }
};


module.exports = {
    signup,
    login,
    logout,
    getCurrentUser
};