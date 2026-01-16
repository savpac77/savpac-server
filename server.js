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

    const messages = [
      {
        role: "system",
        content:
          "Tu es un expert SAV chauffage, climatisation, PAC. Donne un diagnostic clair, simple et actionnable.",
      },
      {
        role: "user",
        content: [
          ...(text
            ? [{ type: "text", text: `Description utilisateur: ${text}` }]
            : []),
          ...(imageBase64
            ? [
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                  },
                },
              ]
            : []),
        ],
      },
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 400,
      }),
    });

    const data = await response.json();

    res.json({
      success: true,
      result: data.choices[0].message.content,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur analyse IA" });
  }
});

app.listen(3000, () => {
  console.log("✅ Serveur IA lancé sur http://localhost:3000");
});