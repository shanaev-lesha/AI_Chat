import { runSelfImprovingDebate } from "../services/multiAgent.service.js";

export async function agentsController(req, res) {
  const topic = req.body.topic || "Debate the impact of AI on society";
  const turns = req.body.turns || 2;

  try {
    const result = await runSelfImprovingDebate(topic, turns);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка self-improving агентов" });
  }
}