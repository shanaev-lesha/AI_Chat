import { createClient } from "@deepgram/sdk";

export async function textToSpeech(text) {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
        throw new Error("DEEPGRAM_API_KEY missing in .env");
    }

    const deepgram = createClient(apiKey);

    const response = await deepgram.speak.request(
        { text },
        { model: "aura-2-thalia-en" }
    );

    const stream = await response.getStream();

    if (!stream) {
        throw new Error("Deepgram returned no stream");
    }

    return stream;
}