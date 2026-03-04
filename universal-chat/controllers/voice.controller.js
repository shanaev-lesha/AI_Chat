import { textToSpeech } from "../services/voice.service.js";

export async function voiceController(req, res) {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: "Text required" });
    }

    try {
        const stream = await textToSpeech(text);

        const chunks = [];

        for await (const chunk of stream) {
            chunks.push(chunk);
        }

        const audioBuffer = Buffer.concat(chunks);

        res.setHeader("Content-Type", "audio/mpeg");
        res.send(audioBuffer);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Voice generation error" });
    }
}