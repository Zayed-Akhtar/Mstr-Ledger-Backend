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
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cache-Control",
      "Expires",
      "Pragma",
    ],
    exposedHeaders: ["Content-Disposition"],
    credentials: true,
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
app.listen(3000, () => console.log("app is running on port 3000"));