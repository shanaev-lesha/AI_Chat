import agentAPrompt from "../prompts/agentA.prompt.js";
import agentBPrompt from "../prompts/agentB.prompt.js";
import judgePrompt from "../prompts/judge.prompt.js";
import improvePrompt from "../prompts/improve.prompt.js";

const PROMPTS = {
    agentA: agentAPrompt,
    agentB: agentBPrompt,
    judge: judgePrompt,
    improve: improvePrompt
};

const cache = new Map();

async function callLLM(messages) {
    const key = JSON.stringify(messages);
    if (cache.has(key)) {
        return cache.get(key);
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
            model: "arcee-ai/trinity-mini:free",
            messages
        })
    });

    if (response.status === 429) {
        throw new Error("LLM rate limit reached. Try later.");
    }

    const data = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(data));

    const result = data.choices[0].message.content;
    cache.set(key, result);
    return result;
}

async function runAgent(promptTemplate, topic, opponent = "") {
    let prompt = promptTemplate.replace(/{topic}/g, topic);

    if (typeof opponent === "object") {
        prompt = prompt.replace(/{debate}/g, JSON.stringify(opponent));
    } else {
        prompt = prompt.replace(/{opponent}/g, opponent);
    }

    const userContent =
        typeof opponent === "object"
            ? JSON.stringify(opponent)
            : opponent || topic;

    return await callLLM([
        { role: "system", content: prompt },
        { role: "user", content: userContent }
    ]);
}

async function improveAgentPrompt(topic, prompt, judgeFeedback) {
    const template = PROMPTS.improve;

    const filled = template
        .replace("{topic}", topic)
        .replace("{prompt}", prompt)
        .replace("{feedback}", judgeFeedback);

    return await callLLM([
        { role: "system", content: filled },
        { role: "user", content: "Improve the agent prompt." }
    ]);
}

export async function runSelfImprovingDebate(topic, rounds = 2) {
    let promptA = PROMPTS.agentA;
    let promptB = PROMPTS.agentB;

    const history = [];

    for (let i = 0; i < rounds; i++) {
        const agentA = await runAgent(promptA, topic);
        const agentB = await runAgent(promptB, topic, agentA);

        const agentA_rebuttal = await runAgent(promptA, topic, agentB);
        const agentB_rebuttal = await runAgent(promptB, topic, agentA_rebuttal);

        const judge = await runAgent(PROMPTS.judge, topic, {
            agentA,
            agentB,
            agentA_rebuttal,
            agentB_rebuttal
        });

        history.push({
            round: i + 1,
            promptA,
            promptB,
            agentA,
            agentB,
            agentA_rebuttal,
            agentB_rebuttal,
            judge
        });

        // улучшение агентов
        promptA = await improveAgentPrompt(topic, promptA, judge);
        promptB = await improveAgentPrompt(topic, promptB, judge);
    }

    return {
        topic,
        rounds: history
    };
}