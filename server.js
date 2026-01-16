const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const OpenAI = require("openai");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/analyze", upload.single("photo"), async (req, res) => {
  try {
    const userText = req.body.text || "";
    let imageBase64 = null;

    if (req.file) {
      const buffer = fs.readFileSync(req.file.path);
      imageBase64 = buffer.toString("base64");
      fs.unlinkSync(req.file.path);
    }

    const input = [
      {
        role: "system",
        content: [
          {
            type: "output_text",
            text: "Tu es un expert SAV en chauffage, climatisation et pompes à chaleur. Donne un diagnostic clair, structuré et actionnable.",
          },
        ],
      },
      {
        role: "user",
        content: [
          ...(userText
            ? [{ type: "input_text", text: userText }]
            : []),
          ...(imageBase64
            ? [
                {
                  type: "input_image",
                  image_base64: imageBase64,
                },
              ]
            : []),
        ],
      },
    ];

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input,
      max_output_tokens: 400,
    });

    const outputText =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text ||
      "Aucune réponse IA";

    res.json({
      success: true,
      result: outputText,
    });
  } catch (error) {
    console.error("❌ Erreur OpenAI :", error);
    res.status(500).json({ error: "Erreur analyse IA" });
  }
});

app.get("/", (req, res) => {
  res.send("✅ Serveur IA SAVPAC opérationnel");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur IA lancé sur le port ${PORT}`);
});