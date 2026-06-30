import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { callGroqChat, extractTopic } from "./groqClient.js";
import { getOrCreateTopicContent } from "./rag.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;

app.set("trust proxy", 1);

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests from this IP, please try again after a minute",
  },
});

app.get("/", (req, res) => {
  res.send("✅ English Tutor Backend is successfully running on Render!");
});

// Mock LipSync Timeline Data Generator
const generateLipSyncData = (text) => {
  const words = text.split(" ");
  const mouthCues = [];
  let time = 0;

  mouthCues.push({ start: time, end: time + 0.1, value: "X" });
  time += 0.1;

  words.forEach((word) => {
    const durationPerLetter = 0.08;
    const cleanWord = word.replace(/[^a-zA-Z]/g, "").toUpperCase();

    for (let i = 0; i < cleanWord.length; i++) {
      const char = cleanWord[i];
      let viseme = "B";

      if (["A", "E", "I", "O", "U"].includes(char)) viseme = "O";
      else if (["M", "P", "B"].includes(char)) viseme = "A";
      else if (["F", "V"].includes(char)) viseme = "C";
      else if (["L", "R"].includes(char)) viseme = "D";

      const endTime = time + durationPerLetter;
      mouthCues.push({
        start: time,
        end: endTime,
        value: viseme,
      });

      time = endTime;
    }

    time += 0.05;
  });

  mouthCues.push({
    start: time,
    end: time + 0.2,
    value: "X",
  });

  return {
    metadata: {
      duration: time + 0.2,
    },
    mouthCues,
  };
};

// =========================
// Main Chat Handler
// =========================
const handleChat = async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({
      error: "Message is required",
    });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({
      error: "API key configuration missing on server",
    });
  }

  try {
    const topic = await extractTopic(message);

    const topicNotes = await getOrCreateTopicContent(topic);

    const systemPrompt = `
You are an experienced English Tutor from the United Kingdom.

Always speak in natural British English.

Guidelines:
- Use British spelling such as colour, favourite, organise, travelling and centre.
- Use British vocabulary such as lift, flat, holiday, queue, timetable, biscuit and mobile.
- Explain grammar according to standard British English.
- Be friendly, encouraging and patient.
- Correct mistakes politely.
- Keep answers concise and conversational.
- Never use American English unless the learner specifically asks for the differences.

Teaching Notes:
${topicNotes}

Use these teaching notes while answering.
Keep every reply under two sentences.
`;

    const replyText = await callGroqChat([
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: message,
      },
    ]);

    const lipsyncJson = generateLipSyncData(replyText);

    res.json({
      messages: [
        {
          text: replyText,
          audio: null,
          lipsync: lipsyncJson,
          animation:
            replyText.length > 50 ? "Talking_1" : "Talking_0",
          facialExpression: "smile",
        },
      ],
    });
  } catch (error) {
    console.error(error);

    if (error.message?.includes("Too Many Requests")) {
      return res.status(503).json({
        messages: [
          {
            text: "The tutor is currently helping many students. Please try again in one minute.",
            facialExpression: "concerned",
            animation: "Idle",
          },
        ],
      });
    }

    res.status(500).json({
      error: "Internal server error.",
      details: error.message,
    });
  }
};

app.post("/", limiter, handleChat);
app.post("/chat", limiter, handleChat);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;