const express = require("express");
const cors = require("cors");
require("dotenv").config();
const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

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
 * ROUTE ANALYSE
 */
app.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Texte manquant" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "Tu es un expert SAV chauffage. Tu donnes des diagnostics clairs, structurés et professionnels.",
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0.3,
    });

    const diagnostic =
      completion.choices?.[0]?.message?.content || "Aucune réponse IA";

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