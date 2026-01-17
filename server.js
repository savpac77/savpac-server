const express = require("express");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config();
const OpenAI = require("openai");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

/* ================================
   CONFIG
================================ */

const PORT = process.env.PORT || 10000;

if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY manquante");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ================================
   MULTER (UPLOAD PHOTO)
================================ */

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 Mo
});

/* ================================
   ROUTE TEST
================================ */

app.get("/", (req, res) => {
  res.json({ status: "SAVPAC server OK" });
});

/* ================================
   ANALYSE PHOTO + TEXTE
================================ */

app.post("/analyze-photo", upload.single("photo"), async (req, res) => {
  console.log("📸 analyze-photo called");

  try {
    const file = req.file;
    const text = req.body?.text || "";

    console.log("📄 text:", text);
    console.log("🖼️ file:", file?.path);

    if (!file && !text.trim()) {
      return res.status(400).json({
        error: "Aucune photo ni texte reçu",
      });
    }

    let imagePart = [];
    if (file) {
      const imageBuffer = fs.readFileSync(file.path);
      const base64Image = imageBuffer.toString("base64");

      imagePart.push({
        type: "input_image",
        image_base64: base64Image,
      });
    }

    const messages = [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              text ||
              "Analyse cette installation de chauffage et donne un diagnostic clair.",
          },
          ...imagePart,
        ],
      },
    ];

    console.log("🤖 Envoi à OpenAI...");

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: messages,
      max_output_tokens: 500,
    });

    const diagnostic =
      response.output_text || "Aucune analyse générée.";

    console.log("✅ Diagnostic généré");

    if (file) {
      fs.unlinkSync(file.path); // supprime l'image après traitement
    }

    return res.json({
      success: true,
      diagnostic,
    });
  } catch (err) {
    console.error("❌ ERREUR analyze-photo:", err);

    return res.status(500).json({
      error: "Erreur serveur IA",
      details: err.message,
    });
  }
});

/* ================================
   LANCEMENT SERVEUR
================================ */

app.listen(PORT, () => {
  console.log(`✅ Serveur SAVPAC IA lancé sur ${PORT}`);
});