import { runMultiAgentConversation } from "../services/multiAgent.service.js";

export async function agentsController(req, res) {
  const { topic, turns } = req.body;

  if (!topic) {
    return res.status(400).json({ error: "Topic is required" });
  }

  try {
    const result = await runMultiAgentConversation(topic, turns || 3);
    res.json({ conversation: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка мульти-агента" });
  }
}