const express = require("express");
const cors = require("cors");
require("dotenv").config();
const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

// =======================
// CHECK OPENAI KEY
// =======================
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY manquante !");
} else {
  console.log("✅ OPENAI_API_KEY détectée");
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// =======================
// ROUTE TEST
// =======================
app.get("/", (req, res) => {
  res.json({ status: "SAVPAC server OK" });
});

// =======================
// ROUTE ANALYSE
// =======================
app.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Texte manquant" });
    }

    console.log("📨 Texte reçu :", text);

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Tu es un expert SAV chauffage.
Analyse le problème suivant et donne un diagnostic clair, structuré et professionnel :

${text}`,
            },
          ],
        },
      ],
    });

    console.log("📦 Réponse OpenAI brute reçue");

    let diagnostic = null;

    for (const item of response.output || []) {
      for (const content of item.content || []) {
        if (content.type === "output_text" && content.text) {
          diagnostic = content.text;
          break;
        }
      }
      if (diagnostic) break;
    }

    if (!diagnostic) {
      console.warn("⚠️ Aucune sortie texte IA trouvée");
      return res.json({
        success: true,
        diagnostic: "Aucune réponse IA générée.",
      });
    }

    res.json({
      success: true,
      diagnostic,
    });
  } catch (error) {
    console.error("❌ ERREUR OPENAI :", error);
    res.status(500).json({
      error: "Erreur serveur IA",
      details: error.message,
    });
  }
});

// =======================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Serveur SAVPAC IA lancé sur le port ${PORT}`);
});