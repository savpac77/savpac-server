// server.js
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import multer from "multer";
import OpenAI from "openai";

dotenv.config();

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🔹 Test serveur
app.get("/", (req, res) => {
  res.json({ status: "SAVPAC server OK" });
});

// 🔹 Analyse photo
app.post("/analyze-photo", upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        diagnostic: "Aucune photo reçue.",
      });
    }

    const imageBase64 = fs.readFileSync(req.file.path, {
      encoding: "base64",
    });

    const prompt = `
Tu es un expert SAV.
Analyse cette photo et donne un diagnostic clair, court et utile.
Si aucun problème n’est visible, dis-le clairement.
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
              image_base64: imageBase64,
            },
          ],
        },
      ],
    });

    // 🔹 Extraction robuste du texte
    let diagnostic = "";

    if (response.output_text) {
      diagnostic = response.output_text.trim();
    }

    if (!diagnostic) {
      diagnostic =
        "L’analyse n’a pas permis d’identifier clairement un problème à partir de cette image.";
    }

    // Nettoyage fichier temporaire
    fs.unlinkSync(req.file.path);

    return res.json({
      diagnostic,
    });
  } catch (error) {
    console.error("❌ ERREUR ANALYSE IA :", error);

    return res.status(500).json({
      diagnostic:
        "Erreur lors de l’analyse IA. Merci de réessayer avec une photo plus nette.",
    });
  }
});

// 🔹 Lancement serveur
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Serveur SAVPAC IA lancé sur ${PORT}`);
});