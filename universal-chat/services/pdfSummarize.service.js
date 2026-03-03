import fs from "fs/promises";

async function callLLM(messages) {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Universal Chat"
        },
        body: JSON.stringify({
            model: "arcee-ai/trinity-mini:free",
            messages
        })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(data));

    return data.choices[0].message.content;
}

function chunkText(text, size = 3000) {
    const chunks = [];
    for (let i = 0; i < text.length; i += size) {
        chunks.push(text.slice(i, i + size));
    }
    return chunks;
}

export async function summarizePdf(pdfPath) {
    const { default: pdf } = await import("pdf-parse");
    const buffer = await fs.readFile(pdfPath);
    const data = await pdf(buffer);

    const chunks = chunkText(data.text);
    const partial = [];

    for (const chunk of chunks) {
        const summary = await callLLM([
            { role: "system", content: "Summarize clearly and concisely." },
            { role: "user", content: chunk }
        ]);
        partial.push(summary);
    }

    const finalSummary = await callLLM([
        { role: "system", content: "Create a structured final summary." },
        { role: "user", content: partial.join("\n") }
    ]);

    return finalSummary;
}