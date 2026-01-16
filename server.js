const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const OpenAI = require("openai");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
          "Tu es un expert SAV chauffage, climatisation et PAC. Donne un diagnostic clair, simple et actionnable.",
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

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input,
      max_output_tokens: 400,
    });

    res.json({
      success: true,
      result: response.output_text,
    });
  } catch (err) {
    console.error("Erreur IA :", err);
    res.status(500).json({ error: "Erreur analyse IA" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Serveur IA SAVPAC lancé sur le port ${PORT}`);
});