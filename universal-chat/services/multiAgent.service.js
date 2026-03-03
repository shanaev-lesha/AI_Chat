import fetch from "node-fetch"; // если не установлен, npm install node-fetch

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

export async function runMultiAgentConversation(topic, turns = 4) {
  let conversation = [];
  let agent1Message = `Let's discuss: ${topic}`;

  for (let i = 0; i < turns; i++) {
    const agent1Reply = await callLLM([
      { role: "system", content: "You are Agent A. Be analytical and logical." },
      { role: "user", content: agent1Message }
    ]);

    conversation.push({ agent: "Agent A", message: agent1Reply });

    const agent2Reply = await callLLM([
      { role: "system", content: "You are Agent B. Be critical and question assumptions." },
      { role: "user", content: agent1Reply }
    ]);

    conversation.push({ agent: "Agent B", message: agent2Reply });
    agent1Message = agent2Reply;
  }

  return conversation;
}