const express = require("express");
const cors = require("cors");
require("dotenv").config();
const OpenAI = require("openai");

const app = express();

/* ===============================
   MIDDLEWARES (OBLIGATOIRES)
================================ */
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Sécurise les requêtes OPTIONS (Expo / mobile)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

/* ===============================
   OPENAI CLIENT
================================ */
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ===============================
   ROUTE TEST (SANTÉ SERVEUR)
================================ */
app.get("/", (req, res) => {
  res.json({ status: "SAVPAC server OK" });
});

/* ===============================
   ROUTE ANALYSE IA (FINALE)
================================ */
app.post("/analyze", async (req, res) => {
  try {
    console.log("=== REQUÊTE /analyze ===");
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);

    const text = req.body?.text;

    // Validation stricte
    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        error: "Texte manquant ou invalide",
      });
    }

    // Appel OpenAI (format RESPONSES officiel)
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Tu es un expert SAV chauffage, climatisation et PAC.
Donne un diagnostic clair, structuré et actionnable.

Problème :
${text}`,
            },
          ],
        },
      ],
    });

    // Extraction sûre de la réponse
    const output =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text ||
      "Aucune réponse IA disponible";

    return res.json({
      success: true,
      diagnostic: output,
    });
  } catch (error) {
    console.error("❌ ERREUR SERVEUR IA :", error);

    return res.status(500).json({
      error: "Erreur serveur IA",
    });
  }
});

/* ===============================
   LANCEMENT SERVEUR
================================ */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Serveur SAVPAC IA lancé sur le port ${PORT}`);
});