import { getPlatformPresence, scoreLeadLocally } from "@/lib/platform-presence";

const GROK_MODEL = "grok-3-latest";
const GROK_BASE_URL = "https://api.x.ai/v1";
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

function aiLog(provider, status, detail = "") {
  console.log(`[ai-service] provider=${provider} status=${status}${detail ? ` detail=${detail}` : ""}`);
}

function requirePrompt(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("AI request requires at least one message.");
  }
}

function toGeminiContents(messages) {
  return messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: `${message.role === "system" ? "System instructions:\n" : ""}${message.content}` }]
  }));
}

async function callGrok(messages, options = {}) {
  if (!process.env.XAI_API_KEY) {
    throw new Error("XAI_API_KEY is not configured.");
  }

  const response = await fetch(`${GROK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.XAI_API_KEY}`
    },
    body: JSON.stringify({
      model: GROK_MODEL,
      messages,
      temperature: options.temperature ?? 0.4,
      response_format: options.json ? { type: "json_object" } : undefined
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Grok failed with ${response.status}: ${body.slice(0, 500)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

async function callGemini(messages, options = {}) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const url = `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      contents: toGeminiContents(messages),
      generationConfig: {
        temperature: options.temperature ?? 0.4,
        responseMimeType: options.json ? "application/json" : "text/plain"
      }
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini failed with ${response.status}: ${body.slice(0, 500)}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.map((part) => part.text).join("").trim() || "";
}

function providerOrder() {
  return process.env.AI_PRIMARY === "gemini" ? ["gemini", "grok"] : ["grok", "gemini"];
}

export async function completeAI(messages, options = {}) {
  requirePrompt(messages);

  const failures = [];
  for (const provider of providerOrder()) {
    try {
      const content = provider === "grok" ? await callGrok(messages, options) : await callGemini(messages, options);
      aiLog(provider, "handled");
      return { provider, content };
    } catch (error) {
      failures.push({ provider, error: error.message });
      aiLog(provider, "failed", error.message);
    }
  }

  throw new Error(`All AI providers failed: ${failures.map((item) => `${item.provider}: ${item.error}`).join(" | ")}`);
}

export function parseAIJson(content) {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error("AI response was not valid JSON.");
  }
}

export async function scoreLeadWithAI(lead) {
  const presence = getPlatformPresence(lead);
  const localScore = scoreLeadLocally(lead);

  const messages = [
    {
      role: "system",
      content:
        "You score prospects for a short-form content agency. Score the whole client, not just one channel. You must consider cross-platform presence on YouTube, Instagram, and Google Maps, then identify the content gap and business value. Return strict JSON only with keys score, contentWeakness, shortFormGap, moneySignal, urgency, platformPresence, reasoning. Each numeric score must be 1-10."
    },
    {
      role: "user",
      content: `Analyze this cross-platform prospect for outreach fit.

Platform presence summary:
${JSON.stringify(presence, null, 2)}

Deterministic baseline score:
${JSON.stringify(localScore, null, 2)}

Lead:
${JSON.stringify(lead, null, 2)}`
    }
  ];

  let result;
  let parsed;
  try {
    result = await completeAI(messages, { json: true, temperature: 0.2 });
    parsed = parseAIJson(result.content);
  } catch (error) {
    console.log(`[ai-service] provider=local-presence status=handled detail=${error.message}`);
    result = { provider: "local-presence" };
    parsed = {};
  }

  return {
    provider: result.provider,
    score: Number(parsed.score || localScore.score || 0),
    breakdown: {
      contentWeakness: Number(parsed.contentWeakness || localScore.breakdown.contentWeakness || 0),
      shortFormGap: Number(parsed.shortFormGap || localScore.breakdown.shortFormGap || 0),
      moneySignal: Number(parsed.moneySignal || localScore.breakdown.moneySignal || 0),
      urgency: Number(parsed.urgency || localScore.breakdown.urgency || 0),
      platformPresence: Number(parsed.platformPresence || localScore.breakdown.platformPresence || 0)
    },
    reasoning: parsed.reasoning || localScore.reasoning || "No reasoning returned.",
    presence
  };
}

export async function generateOutreachWithAI({ lead, platform, context = "", followUp = false }) {
  const tone =
    platform === "email"
      ? "professional, direct, concise email"
      : "casual conversational DM that sounds human and specific";

  const messages = [
    {
      role: "system",
      content:
        "You write personalized outreach for an agency that turns long-form content into Shorts/Reels/TikToks. Never use placeholders. Keep messages concise and reference concrete profile details."
    },
    {
      role: "user",
      content: `Create a ${followUp ? "follow-up" : "first-touch"} ${tone} for platform ${platform}.

Lead:
${JSON.stringify(lead, null, 2)}

Extra context:
${context || "None"}

Return strict JSON only with keys subject and message. For DMs, subject can be an empty string.`
    }
  ];

  let result;
  let parsed;
  try {
    result = await completeAI(messages, { json: true, temperature: 0.55 });
    parsed = parseAIJson(result.content);
  } catch (error) {
    console.log(`[ai-service] provider=local-template status=handled detail=${error.message}`);
    const presence = getPlatformPresence(lead);
    const platformLabel = platform === "email" ? "email" : "DM";
    const opener = followUp ? "Quick follow-up" : "Quick idea";
    const handle = lead.instagram_handle ? `@${lead.instagram_handle}` : lead.x_handle ? `@${lead.x_handle}` : lead.name;
    result = { provider: "local-template" };
    parsed = {
      subject: platform === "email" ? `${opener} for ${lead.name}` : "",
      message:
        platform === "email"
          ? `Hey ${lead.name},\n\nI noticed ${presence.summary.toLowerCase()}. There seems to be room to turn what you already have into a more consistent short-form engine, especially around the platforms where you are not showing up as strongly yet.\n\nI can send over a few specific clip ideas for ${handle} if useful.`
          : `Hey ${handle}, noticed ${presence.summary.toLowerCase()}. You already have the raw material, but there is a clear short-form gap I think could be turned into more consistent leads. Want me to send 2 quick clip ideas?`
    };
  }

  return {
    provider: result.provider,
    subject: parsed.subject || "",
    message: parsed.message || ""
  };
}
