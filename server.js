const express = require("express");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config();
const OpenAI = require("openai");

const app = express();
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.json({ status: "SAVPAC server OK" });
});

app.post(
  "/analyze-photo",
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ error: "Image manquante" });
      }

      const text = req.body.text || "";

      // 🔥 conversion image -> base64
      const base64Image = req.file.buffer.toString("base64");

      const response = await openai.responses.create({
        model: "gpt-4.1",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `
Tu es un expert SAV chauffage.
Analyse VISUELLEMENT la photo fournie ainsi que le texte utilisateur.

Objectif :
- identifier défaut visible
- reconnaître code erreur éventuel
- proposer un diagnostic clair et professionnel

Texte utilisateur :
"${text}"
                `,
              },
              {
                type: "input_image",
                image_base64: base64Image,
              },
            ],
          },
        ],
      });

      const diagnostic =
        response.output_text ||
        "Aucune réponse IA";

      res.json({
        success: true,
        diagnostic,
      });
    } catch (err) {
      console.error("Erreur IA Vision :", err);
      res
        .status(500)
        .json({ error: "Erreur serveur IA" });
    }
  }
);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Serveur SAVPAC IA lancé sur ${PORT}`);
});