// server.js — VERSION STABLE RENDER + OPENAI IMAGE 2025

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 10000;

// --- MIDDLEWARES ---
app.use(cors());
app.use(bodyParser.json({ limit: "15mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "15mb" }));

// --- OPENAI ---
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY manquante");
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --- HEALTH CHECK ---
app.get("/", (req, res) => {
  res.send("SAVPAC IA server OK");
});

// --- ANALYZE PHOTO ---
app.post("/analyze-photo", async (req, res) => {
  try {
    const { imageBase64, text } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Image manquante" });
    }

    // 🔥 IMPORTANT : retirer le préfixe data:image/...
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                text ||
                "Analyse cette image et identifie l'appareil et les erreurs possibles.",
            },
            {
              type: "input_image",
              image_base64: cleanBase64,
            },
          ],
        },
      ],
    });

    const output =
      response.output_text ||
      "Aucun diagnostic n’a pu être généré.";

    res.json({ diagnostic: output });
  } catch (err) {
    console.error("❌ Erreur IA :", err);
    res.status(500).json({ error: "Erreur serveur IA" });
  }
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`✅ Serveur SAVPAC IA lancé sur le port ${PORT}`);
});