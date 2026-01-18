// server.js — SAVPAC IA SERVER (FINAL STABLE)

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const OpenAI = require("openai");
const cloudinary = require("cloudinary").v2;

const app = express();

// ===============================
// MIDDLEWARE
// ===============================
app.use(cors());
app.use(bodyParser.json({ limit: "20mb" }));

// ===============================
// CONFIG OPENAI
// ===============================
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY manquante");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ===============================
// CONFIG CLOUDINARY
// ===============================
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  console.error("❌ Variables Cloudinary manquantes");
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ===============================
// HEALTH CHECK
// ===============================
app.get("/", (req, res) => {
  res.json({ status: "✅ SAVPAC server OK" });
});

// ===============================
// ANALYZE PHOTO ENDPOINT
// ===============================
app.post("/analyze-photo", async (req, res) => {
  try {
    let { imageBase64, text } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Image manquante" });
    }

    // 🔒 SÉCURITÉ ABSOLUE : forcer le format base64 valide
    if (!imageBase64.startsWith("data:image")) {
      imageBase64 = `data:image/jpeg;base64,${imageBase64}`;
    }

    console.log("📸 Image reçue (début) :", imageBase64.slice(0, 40));

    // 1️⃣ Upload Cloudinary
    const upload = await cloudinary.uploader.upload(imageBase64, {
      folder: "savpac",
    });

    const imageUrl = upload.secure_url;
    console.log("☁️ Image Cloudinary OK :", imageUrl);

    // 2️⃣ Appel OpenAI (IMAGE VIA URL)
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Tu es un technicien SAV spécialisé en pompes à chaleur Atlantic. " +
                "Analyse la photo et le texte utilisateur pour expliquer clairement " +
                "le diagnostic, ce que cela signifie et les actions possibles.\n\n" +
                (text || "Aucune précision supplémentaire."),
            },
            {
              type: "input_image",
              image_url: imageUrl,
            },
          ],
        },
      ],
    });

    const diagnostic =
      response.output_text || "Aucun diagnostic généré.";

    res.json({ diagnostic });
  } catch (error) {
    console.error("❌ ERREUR IA :", error);
    res.status(500).json({ error: "Erreur serveur IA" });
  }
});

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Serveur SAVPAC IA lancé sur le port ${PORT}`);
});