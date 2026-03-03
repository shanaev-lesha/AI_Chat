import { summarizePdf } from "../services/pdfSummarize.service.js";

export async function summarizeController(req, res) {
    const { pdfPath } = req.body;

    if (!pdfPath) {
        return res.status(400).json({ error: "pdfPath is required" });
    }

    try {
        const summary = await summarizePdf(pdfPath);
        res.json({ summary });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Ошибка суммаризации" });
    }
}