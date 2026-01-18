import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import OpenAI from "openai";

dotenv.config();

const app = express();

/**
 * Body size augmenté pour images base64
 */
app.use(cors());
app.use(express.json({ limit: "15mb" }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

let lastDiagnostic = null;

/**
 * Endpoint principal d’analyse
 */
app.post("/analyze-photo", async (req, res) => {
  try {
    const { imageBase64, text } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        error: "Aucune image reçue",
      });
    }

    const prompt = `
Tu es un expert SAV en chauffage et pompe à chaleur.
Analyse la photo fournie et le texte utilisateur.
Donne un diagnostic clair, structuré et compréhensible.

Texte utilisateur :
${text || "Aucune précision fournie"}
`;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            {
              type: "input_image",
              image_url: imageBase64,
            },
          ],
        },
      ],
    });

    const diagnostic =
      response.output_text ||
      "Aucun diagnostic n’a pu être généré.";

    lastDiagnostic = diagnostic;

    res.json({ diagnostic });
  } catch (err) {
    console.error("Erreur IA :", err);
    res.status(500).json({
      error: "Erreur serveur IA",
    });
  }
});

/**
 * Endpoint pour récupérer le dernier diagnostic (chat)
 */
app.get("/last-diagnostic", (req, res) => {
  res.json({
    diagnostic: lastDiagnostic || "Aucun diagnostic disponible.",
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Serveur SAVPAC IA lancé sur le port", PORT);
});