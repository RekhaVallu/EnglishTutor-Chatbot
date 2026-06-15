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
// A. Rate Limiting: To prevent spam and abuse as you suggested.
const limiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minute
	max: 5, // Limit each IP to 5 requests per minute as per your requirement
	standardHeaders: true,
	legacyHeaders: false,
	// Custom message for rate-limited requests
	message: {
		error: "Too many requests from this IP, please try again after a minute",
	},
});

// 1. Simple status check so you can verify the server is awake!
app.get("/", (req, res) => {
  res.send("✅ English Tutor Backend is successfully running on Render!");
});

// Mock LipSync Timeline Data Generator for Avatar blendshapes
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
      mouthCues.push({ start: time, end: endTime, value: viseme });
      time = endTime;
    }
    time += 0.05;
  });

  mouthCues.push({ start: time, end: time + 0.2, value: "X" });
  
  return {
    metadata: { duration: time + 0.2 },
    mouthCues: mouthCues
  };
};

// Main Chat Handler Function
const handleChat = async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  if (!process.env.GROQ_API_KEY) {
    console.error("Error: GROQ_API_KEY is not defined in environment variables.");
    return res.status(500).json({ error: "API key configuration missing on server" });
  }

  try {
    // 1. Extract the topic from the user's message
    const topic = await extractTopic(message);
    
    // 2. Retrieve existing notes from our knowledge base, or generate new ones
    const topicNotes = await getOrCreateTopicContent(topic);

    // 3. Ask the AI to reply, providing it with the study notes as context
    const systemPrompt = `You are a friendly, encouraging English Tutor AI. Here are your teaching notes on the current topic (${topic}):\n\n${topicNotes}\n\nAnswer the user's message using the concepts from your notes. Keep your answer very short, simple, and under 2 sentences.`;
    
    const replyText = await callGroqChat([
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ]);

    const lipsyncJson = generateLipSyncData(replyText);

    // Express schema output matching Avatar.jsx expectations
    res.json({
      messages: [
        {
          text: replyText,
          audio: null,
          lipsync: lipsyncJson,
          animation: replyText.length > 50 ? "Talking_1" : "Talking_0",
          facialExpression: "smile"
        }
      ]
    });

  } catch (error) {
    console.error("Groq API Error Details:", error);

    // B. Graceful Error Handling: For external API (Groq) rate limits (e.g., 429)
    if (error.message?.includes("Too Many Requests")) {
      return res.status(503).json({ // 503 Service Unavailable is appropriate here
        messages: [{
          text: "The tutor is currently talking to too many students! Please try again in 1 minute.",
          facialExpression: "concerned",
          animation: "Idle"
        }]
      });
    }

    res.status(500).json({
      error: "An internal server error occurred on the server.",
      details: error.message,
    });
  }
};

// Handles BOTH POST / and POST /chat to support all frontend templates securely!
app.post("/", limiter, handleChat);
app.post("/chat", limiter, handleChat);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;