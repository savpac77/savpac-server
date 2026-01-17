const express = require("express");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config();
const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

/* =========================
   CONFIG UPLOAD IMAGE
========================= */
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

/* =========================
   OPENAI
========================= */
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY manquante");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* =========================
   TEST SERVEUR
========================= */
app.get("/", (req, res) => {
  res.json({ status: "SAVPAC server OK" });
});

/* =========================
   TEXTE SEUL
========================= */
app.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Texte manquant" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "Tu es un expert SAV chauffage. Tu fournis des diagnostics clairs et professionnels.",
        },
        { role: "user", content: text },
      ],
      temperature: 0.3,
    });

    res.json({
      success: true,
      diagnostic: completion.choices[0].message.content,
    });
  } catch (e) {
    console.error("❌ ERREUR /analyze", e);
    res.status(500).json({ error: "Erreur serveur IA" });
  }
});

/* =========================
   PHOTO + TEXTE
========================= */
app.post("/analyze-photo", upload.single("image"), async (req, res) => {
  try {
    const text = req.body.text || "";

    if (!req.file && !text) {
      return res.status(400).json({
        error: "Aucune photo ni texte reçu",
      });
    }

    const prompt = `
Analyse cette situation SAV chauffage.

Texte utilisateur :
${text || "Aucun texte fourni"}

Donne un diagnostic probable et des actions concrètes.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "Tu es un expert SAV chauffage, clair, structuré et professionnel.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    });

    res.json({
      success: true,
      diagnostic: completion.choices[0].message.content,
    });
  } catch (e) {
    console.error("❌ ERREUR /analyze-photo", e);
    res.status(500).json({ error: "Erreur serveur IA" });
  }
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Serveur SAVPAC IA lancé sur ${PORT}`);
});