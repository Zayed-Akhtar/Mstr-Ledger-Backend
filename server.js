require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(
  cors({
    origin: "http://localhost:5174",
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
app.listen(3000, ()=>console.log('app is running on port 3000'));