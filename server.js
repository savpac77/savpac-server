const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());

/**
 * Client OpenAI (API officielle)
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Route TEST (pour vérifier que le serveur répond)
 */
app.get("/", (req, res) => {
  res.json({ status: "SAVPAC server OK ✅" });
});

/**
 * ROUTE IA PRINCIPALE
 * POST /analyze
 * - text (optionnel)
 * - photo (optionnel)
 */
app.post("/analyze", upload.single("photo"), async (req, res) => {
  try {
    const userText = req.body.text || "";
    let imageBase64 = null;

    if (req.file) {
      const buffer = fs.readFileSync(req.file.path);
      imageBase64 = buffer.toString("base64");
      fs.unlinkSync(req.file.path);
    }

    // Construction du prompt SAV expert
    const inputContent = [];

    if (userText) {
      inputContent.push({
        type: "input_text",
        text: `Description du problème SAV : ${userText}`,
      });
    }

    if (imageBase64) {
      inputContent.push({
        type: "input_image",
        image_base64: imageBase64,
      });
    }

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: [
            {
              type: "text",
              text: "Tu es un expert SAV en chauffage, chaudières, PAC et climatisation. Donne un diagnostic clair, structuré et actionnable pour un technicien terrain.",
            },
          ],
        },
        {
          role: "user",
          content: inputContent,
        },
      ],
      max_output_tokens: 400,
    });

    const outputText =
      response.output_text ||
      "Aucune réponse IA disponible pour le moment.";

    res.json({
      success: true,
      result: outputText,
    });
  } catch (error) {
    console.error("❌ ERREUR IA :", error);
    res.status(500).json({
      success: false,
      error: "Erreur analyse IA",
    });
  }
});

/**
 * Lancement serveur (Render fournit le PORT)
 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur SAVPAC IA lancé sur le port ${PORT}`);
});