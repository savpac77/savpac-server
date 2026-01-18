import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import OpenAI from "openai";

dotenv.config();

const app = express();

/**
 * IMPORTANT :
 * - on accepte des payloads JSON volumineux (images base64)
 */
app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * ROUTE DIAGNOSTIC IMAGE + TEXTE
 */
app.post("/diagnostic", async (req, res) => {
  try {
    const { imageBase64, text } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Image manquante" });
    }

    const promptText =
      text ||
      "Analyse cet appareil et explique le message affiché, les causes possibles et les actions recommandées.";

    /**
     * FORMAT OPENAI CORRECT (TRÈS IMPORTANT)
     */
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: promptText,
            },
            {
              type: "image_url",
              image_url: {
                url: imageBase64, // data:image/jpeg;base64,...
              },
            },
          ],
        },
      ],
    });

    const message =
      response.output_text ||
      "Analyse terminée mais aucun texte retourné.";

    res.json({
      success: true,
      diagnostic: message,
    });
  } catch (error) {
    console.error("❌ ERREUR OPENAI :", error);

    res.status(500).json({
      success: false,
      error: "Erreur serveur IA",
    });
  }
});

/**
 * ROUTE TEST
 */
app.get("/", (req, res) => {
  res.send("✅ Serveur SAVPAC IA opérationnel");
});

/**
 * LANCEMENT SERVEUR
 */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Serveur SAVPAC IA lancé sur le port ${PORT}`);
});