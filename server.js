require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const OpenAI = require("openai");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ===========================
   ROUTE TEST
=========================== */
app.get("/", (req, res) => {
  res.json({ status: "SAVPAC server OK" });
});

/* ===========================
   ANALYSE PHOTO + TEXTE
=========================== */
app.post("/analyze-photo", upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Aucune photo reçue",
      });
    }

    const userText =
      req.body.text && req.body.text.trim() !== ""
        ? req.body.text
        : "Analyser cet appareil de chauffage et détecter tout problème visible ou suspect.";

    const imageBuffer = fs.readFileSync(req.file.path);
    const imageBase64 = imageBuffer.toString("base64");

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: userText },
            {
              type: "input_image",
              image_url: `data:image/jpeg;base64,${imageBase64}`,
            },
          ],
        },
      ],
    });

    fs.unlinkSync(req.file.path);

    const outputText =
      response.output_text && response.output_text.trim() !== ""
        ? response.output_text
        : null;

    if (!outputText) {
      return res.json({
        diagnostic:
          "L’analyse n’a pas permis d’identifier un problème avec certitude. Merci de fournir une photo plus nette ou des détails supplémentaires.",
      });
    }

    res.json({
      diagnostic: outputText,
    });
  } catch (error) {
    console.error("❌ Erreur analyse IA :", error);
    res.status(500).json({
      error: "Erreur serveur IA",
    });
  }
});

/* ===========================
   LANCEMENT SERVEUR
=========================== */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Serveur SAVPAC IA lancé sur ${PORT}`);
});