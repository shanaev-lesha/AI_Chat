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

export async function runMultiAgentConversation(topic, turns = 3) {
    const conversation = [];

    let history = [
        {
            role: "system",
            content: "This is a debate between two agents."
        }
    ];

    let lastMessage = `Topic: ${topic}`;

    for (let i = 0; i < turns; i++) {
        // Agent A (аналитик)
        const agentAReply = await callLLM([
            ...history,
            {
                role: "system",
                content: "You are Agent A. Be logical, structured, and defend your position concisely (max 250 words)."
            },
            { role: "user", content: lastMessage }
        ]);

        conversation.push({ agent: "Agent A", message: agentAReply });

        history.push({ role: "assistant", content: agentAReply });

        // Agent B (критик)
        const agentBReply = await callLLM([
            ...history,
            {
                role: "system",
                content: "You are Agent B. Critically challenge Agent A. Focus on weak points. Be concise (max 250 words)."
            },
            { role: "user", content: agentAReply }
        ]);

        conversation.push({ agent: "Agent B", message: agentBReply });

        history.push({ role: "assistant", content: agentBReply });

        lastMessage = agentBReply;
    }

    // Финальный модератор
    const conclusion = await callLLM([
        {
            role: "system",
            content: "You are a neutral moderator. Summarize the debate and determine which arguments were stronger."
        },
        { role: "user", content: JSON.stringify(conversation) }
    ]);

    return {
        debate: conversation,
        moderatorConclusion: conclusion
    };
}