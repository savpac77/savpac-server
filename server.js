const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.post("/analyze", (req, res) => {
  console.log("BODY REÇU :", req.body);

  return res.json({
    success: true,
    received: req.body,
    message: "TEST OK",
  });
});

app.get("/", (req, res) => {
  res.json({ status: "SERVER OK" });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("SERVER TEST ON PORT", PORT);
});