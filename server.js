const express = require("express");
const cors = require("cors");
require("dotenv").config();
const OpenAI = require("openai");

const app = express();

app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY manquante");
} else {
  console.log("✅ OPENAI_API_KEY détectée");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.json({ status: "SAVPAC server OK" });
});

app.post("/analyze-photo", async (req, res) => {
  try {
    const { imageBase64, text } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Image manquante" });
    }

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "Tu es un expert SAV chauffage et PAC. Analyse la photo et le texte et fournis un diagnostic clair, structuré et professionnel.",
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: text || "Aucune précision fournie",
            },
            {
              type: "input_image",
              image_url: imageBase64, // ✅ FORMAT CORRECT
            },
          ],
        },
      ],
    });

    const diagnostic =
      response.output_text || "Aucun diagnostic généré.";

    res.json({
      success: true,
      diagnostic,
    });
  } catch (error) {
    console.error("❌ Erreur OpenAI :", error);
    res.status(500).json({ error: "Erreur serveur IA" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Serveur SAVPAC IA lancé sur le port ${PORT}`);
});