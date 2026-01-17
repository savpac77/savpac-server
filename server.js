const express = require("express");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config();
const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

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
      const text = req.body.text || "";
      const image = req.file;

      if (!image) {
        return res.status(400).json({ error: "Image manquante" });
      }

      const prompt = `
Tu es un expert SAV chauffage.
Analyse la photo fournie (défaut, code erreur, pièce visible)
et le texte utilisateur.

Texte utilisateur :
"${text}"

Donne un diagnostic clair, structuré et professionnel.
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: "Expert SAV chauffage" },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      });

      const diagnostic =
        completion.choices?.[0]?.message?.content ||
        "Aucune réponse IA";

      res.json({ success: true, diagnostic });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Erreur serveur IA" });
    }
  }
);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Serveur SAVPAC IA lancé sur ${PORT}`);
});