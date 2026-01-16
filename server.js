const express = require("express");
const cors = require("cors");
require("dotenv").config();
const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Test serveur
app.get("/", (req, res) => {
  res.json({ status: "SAVPAC server OK" });
});

// Analyse IA
app.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Texte manquant" });
    }

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Tu es un expert SAV chauffage.
Analyse le problème suivant et donne un diagnostic clair et structuré :

${text}`,
            },
          ],
        },
      ],
    });

    const output =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text ||
      "Aucune réponse IA";

    res.json({
      success: true,
      diagnostic: output,
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