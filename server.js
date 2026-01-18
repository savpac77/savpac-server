import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import OpenAI from "openai";

dotenv.config();

const app = express();

/* =========================
   ✅ BODY SIZE (IMPORTANT)
========================= */
app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

/* =========================
   ✅ OPENAI
========================= */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* =========================
   ✅ HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.json({ status: "SAVPAC server OK" });
});

/* =========================
   🧠 ANALYSE PHOTO
========================= */
app.post("/analyze-photo", async (req, res) => {
  try {
    const { imageBase64, text } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        error: "Image manquante",
      });
    }

    const prompt = `
Tu es un technicien SAV expert en chauffage, PAC et thermostats.

Analyse la photo fournie.
Si un code ou un message est visible, explique-le clairement.
Propose un diagnostic simple, concret et exploitable.

Informations utilisateur :
${text || "Aucune information supplémentaire"}
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

    const diagnostic =
      response.output_text ||
      "Aucun diagnostic n’a pu être généré.";

    return res.json({
      diagnostic,
    });
  } catch (error) {
    console.error("❌ IA ERROR:", error);

    return res.status(500).json({
      error: "Erreur interne serveur IA",
    });
  }
});

/* =========================
   🚀 START SERVER
========================= */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Serveur SAVPAC IA lancé sur ${PORT}`);
});