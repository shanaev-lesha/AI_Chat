import { createClient } from "@deepgram/sdk";

export function getDeepgram() {
    const key = process.env.DEEPGRAM_API_KEY;
    if (!key) {
        throw new Error("DEEPGRAM_API_KEY missing in .env");
    }

    return createClient(key);
}