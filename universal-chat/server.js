import dotenv from "dotenv";
dotenv.config();
console.log("Deepgram key:", process.env.DEEPGRAM_API_KEY);

import express from "express";
import cors from "cors";
import multer from "multer";
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";
import summarizeRouter from "./routes/summarize.route.js";
import agentsRouter from "./routes/agents.route.js";
import voiceRouter from "./routes/voice.route.js";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse"); // работает с v1.1.1

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));
app.use("/summarize", summarizeRouter);
app.use("/agents", agentsRouter);
app.use("/voice", voiceRouter);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

const upload = multer();

// ===== Память =====
let chatHistory = [];
let documentChunks = [];

// ===== ЧАТ С RAG =====
app.post("/chat", async (req, res) => {
    try {
        const { message, model } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        chatHistory.push({ role: "user", content: message });

        let context = "";

        if (documentChunks.length > 0) {
            const keyword = message.toLowerCase().split(" ")[0];

            const relevantChunks = documentChunks.filter(chunk =>
                chunk.toLowerCase().includes(keyword)
            );

            context = relevantChunks.slice(0, 3).join("\n\n");
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Universal Chat"
            },
            body: JSON.stringify({
                model: model || "arcee-ai/trinity-mini:free",
                messages: [
                    {
                        role: "system",
                        content:
                            "Отвечай только на основе контекста документа. Если информации нет — скажи, что её нет."
                    },
                    ...(context
                        ? [{ role: "system", content: `Контекст:\n${context}` }]
                        : []),
                    ...chatHistory
                ]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(500).json({ error: data });
        }

        const reply = data.choices[0].message.content;

        chatHistory.push({ role: "assistant", content: reply });

        res.json({ reply });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка LLM" });
    }
});

// ===== ЗАГРУЗКА PDF =====
app.post("/upload", upload.single("file"), async (req, res) => {
    try {
        const data = await pdf(req.file.buffer);
        const fullText = data.text;

        const chunkSize = 1000;
        documentChunks = [];

        for (let i = 0; i < fullText.length; i += chunkSize) {
            documentChunks.push(fullText.slice(i, i + chunkSize));
        }

        res.json({
            message: "PDF загружен",
            pages: data.numpages,
            chunks: documentChunks.length
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка загрузки PDF" });
    }
});

// ===== RESET =====
app.post("/reset", (req, res) => {
    chatHistory = [];
    res.json({ message: "История очищена" });
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});