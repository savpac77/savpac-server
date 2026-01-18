const express = require("express");
const cors = require("cors");
require("dotenv").config();
const OpenAI = require("openai");

const app = express();

/**
 * IMPORTANT : augmenter la taille max du body
 * (photo base64)
 */
app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

/**
 * Vérification clé OpenAI
 */
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY manquante !");
} else {
  console.log("✅ OPENAI_API_KEY détectée");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * ROUTE TEST
 */
app.get("/", (req, res) => {
  res.json({ status: "SAVPAC server OK" });
});

/**
 * ROUTE ANALYSE PHOTO + TEXTE
 */
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
            "Tu es un expert SAV chauffage/PAC. Analyse la photo et le texte fournis et donne un diagnostic clair, structuré et professionnel.",
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
              image_base64: imageBase64, // 👈 base64 BRUT (sans prefix)
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

/**
 * LANCEMENT SERVEUR
 */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Serveur SAVPAC IA lancé sur le port ${PORT}`);
});