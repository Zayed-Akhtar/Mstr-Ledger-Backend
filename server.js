require("dotenv").config();
const express = require("express");
const cors = require("cors");

const transactionRouter = require("./routes/transactionRouter");

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
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (req, res)=>{
  res.send("Welcome to Mstr-Ledger API, happy coding!");
});
app.use("/api/transaction", transactionRouter);
app.listen(3000, ()=>console.log('app is running on port 3000'));