require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const transactionRouter = require("./routes/transactionRouter");
const partyRouter = require("./routes/partyRoutes");
const areaRouter = require("./routes/areaRoutes");
const authRouter = require("./routes/authenticationRoutes");

const app = express();

const db = require("./config/mongodb-cpnnection");

const allowedOrigins = [
    "http://localhost:5173"
];

app.use(
    cors({
        origin: function (origin, callback) {

            // Allow requests without an origin
            // such as Postman/server-to-server requests
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(new Error("Not allowed by CORS"));
        },

        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS"
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "Cache-Control",
            "Expires",
            "Pragma"
        ],

        exposedHeaders: [
            "Content-Disposition"
        ],

        credentials: true
    })
);

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
    res.send("Welcome to Mstr-Ledger API, happy coding!");
});

app.use("/api/transaction", transactionRouter);
app.use("/api/party", partyRouter);
app.use("/api/area", areaRouter);
app.use("/api/auth", authRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`app is running on port ${PORT}`);
});