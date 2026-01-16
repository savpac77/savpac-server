import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import multer from "multer";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());

app.post("/analyze", upload.single("photo"), async (req, res) => {
  try {
    const text = req.body.text || "";
    let imageBase64 = null;

    if (req.file) {
      const buffer = fs.readFileSync(req.file.path);
      imageBase64 = buffer.toString("base64");
      fs.unlinkSync(req.file.path);
    }

    const input = [
      {
        role: "system",
        content:
          "Tu es un expert SAV chauffage, climatisation et pompe à chaleur. Donne un diagnostic clair, simple et actionnable.",
      },
      {
        role: "user",
        content: [
          ...(text
            ? [{ type: "text", text: `Description utilisateur : ${text}` }]
            : []),
          ...(imageBase64
            ? [
                {
                  type: "input_image",
                  image_base64: imageBase64,
                },
              ]
            : []),
        ],
      },
    ];

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input,
        max_output_tokens: 400,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", data);
      return res.status(500).json({ error: "Erreur OpenAI" });
    }

    res.json({
      success: true,
      result: data.output_text,
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Erreur analyse IA" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur IA SAVPAC lancé sur le port ${PORT}`);
});