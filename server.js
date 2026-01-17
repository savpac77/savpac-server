const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());

app.get("/", (req, res) => {
  res.json({ status: "SAVPAC server OK" });
});

app.post("/analyze-photo", upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Aucune image reçue" });
    }

    const base64Image = req.file.buffer.toString("base64");
    const userText = req.body.text || "";

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          input: [
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text:
                    "Tu es un expert SAV chauffage. Analyse cette photo et le texte utilisateur et donne un diagnostic clair.\n\nTexte utilisateur : " +
                    userText,
                },
                {
                  type: "input_image",
                  image_url: `data:image/jpeg;base64,${base64Image}`,
                },
              ],
            },
          ],
        }),
      }
    );

    const raw = await openaiResponse.text();

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      console.error("Réponse OpenAI non JSON :", raw);
      return res.status(500).json({ error: "Réponse OpenAI invalide" });
    }

    if (!openaiResponse.ok) {
      console.error("Erreur OpenAI :", data);
      return res.status(500).json({ error: "Erreur OpenAI" });
    }

    const diagnostic =
      data.output_text || "Aucun diagnostic n’a pu être généré.";

    res.json({ diagnostic });
  } catch (err) {
    console.error("Erreur serveur :", err);
    res.status(500).json({ error: "Erreur serveur IA" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Serveur SAVPAC IA lancé sur ${PORT}`);
});