require("dotenv").config();

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.send("✅ Serveur SAVPAC IA actif");
});

app.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
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
Analyse ce problème et donne un diagnostic clair, des causes possibles et des actions à vérifier.

Problème :
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
    res.status(500).json({ error: "Erreur analyse IA" });
  }
});

app.listen(port, () => {
  console.log(`✅ Serveur SAVPAC IA lancé sur le port ${port}`);
});