import { getPlatformPresence, scoreLeadLocally } from "@/lib/platform-presence";

const GROK_MODEL = "grok-3-latest";
const GROK_BASE_URL = "https://api.x.ai/v1";
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

// Score threshold — below this, leads are cold-routed, not AI-messaged
export const SCORE_THRESHOLD = 7.0;

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
  if (!process.env.XAI_API_KEY) throw new Error("XAI_API_KEY is not configured.");

  const response = await fetch(`${GROK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${process.env.XAI_API_KEY}` },
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
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured.");

  const url = `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
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
    if (match) return JSON.parse(match[0]);
    throw new Error("AI response was not valid JSON.");
  }
}

export async function scoreLeadWithAI(lead) {
  const presence = getPlatformPresence(lead);
  const localScore = scoreLeadLocally(lead);

  const youtube = lead.platform_payload?.youtube || {};
  const instagram = lead.platform_payload?.instagram || {};
  const maps = lead.platform_payload?.googleMaps || {};
  const followers = lead.follower_counts || {};

  // Build concrete evidence strings so the AI reasons from facts, not vibes
  const evidenceLines = [
    followers.youtube ? `YouTube: ${followers.youtube.toLocaleString()} subscribers` : null,
    youtube.longVideoCount ? `Long-form videos: ${youtube.longVideoCount}` : null,
    youtube.recentShortCount !== undefined ? `Recent Shorts: ${youtube.recentShortCount}` : null,
    followers.instagram ? `Instagram: ${followers.instagram.toLocaleString()} followers` : null,
    instagram.reelCount !== undefined ? `Reels posted: ${instagram.reelCount}` : null,
    instagram.bio ? `Instagram bio: "${instagram.bio}"` : null,
    maps.rating ? `Google Maps rating: ${maps.rating} (${maps.userRatingsTotal} reviews)` : null,
    lead.website ? `Has website: ${lead.website}` : "No website",
    lead.email ? "Has email" : "No email",
    lead.phone ? "Has phone" : "No phone",
    presence.missing.length ? `Missing platforms: ${presence.missing.join(", ")}` : "Present on all 3 platforms"
  ].filter(Boolean);

  const messages = [
    {
      role: "system",
      content: `You score prospects for a short-form content agency. You are looking for businesses or creators who:
1. Have real audiences or foot traffic (money signal)
2. Are producing long-form or static content but have a clear short-form gap
3. Would benefit most urgently from a clips/reels/shorts service

Score each dimension 1-10. Be brutally honest — a score of 9+ means you would call this lead personally right now.
Return strict JSON only: { score, contentWeakness, shortFormGap, moneySignal, urgency, platformPresence, reasoning }
reasoning must be 1-2 sentences MAX referencing specific numbers from the evidence.`
    },
    {
      role: "user",
      content: `Lead: ${lead.name} | Niche: ${lead.niche || "unknown"}
Baseline score (deterministic): ${localScore.score}

Evidence:
${evidenceLines.join("\n")}

Score this lead.`
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
  const presence = getPlatformPresence(lead);
  const youtube = lead.platform_payload?.youtube || {};
  const instagram = lead.platform_payload?.instagram || {};
  const maps = lead.platform_payload?.googleMaps || {};
  const followers = lead.follower_counts || {};

  // Concrete hooks the AI must choose from — this kills generic messages
  const hooks = [
    followers.youtube && youtube.longVideoCount
      ? `They have ${youtube.longVideoCount} long-form videos on YouTube with ${followers.youtube.toLocaleString()} subscribers but only ${youtube.recentShortCount || 0} Shorts — massive untapped clip library.`
      : null,
    followers.instagram && instagram.reelCount !== undefined && instagram.reelCount <= 3
      ? `${followers.instagram.toLocaleString()} Instagram followers but only ${instagram.reelCount} Reels — their static posts are getting buried in an algorithm built for video.`
      : null,
    maps.rating && maps.userRatingsTotal
      ? `${maps.userRatingsTotal} five-star Google reviews and zero short-form content — they're closing on reputation but leaving a massive top-of-funnel hole.`
      : null,
    presence.missing.length
      ? `They're completely absent on ${presence.missing.join(" and ")} — their competitors are eating that audience right now.`
      : null,
    instagram.bio ? `Their bio says "${instagram.bio}" — there's a clear angle here.` : null
  ].filter(Boolean);

  const dmInstructions = `Write a DM that:
- Opens with ONE specific observation about their content gap (use the hooks provided — pick the sharpest one)
- Is under 4 lines. No "I hope this finds you well." No "I came across your profile." Just get to the point.
- Sounds like a human who did 2 minutes of research, not a robot that scraped their profile
- Ends with ONE low-friction question (not "want to jump on a call?")
- Never mentions "short-form agency", "content strategy", or "brand awareness"`;

  const emailInstructions = `Write a cold email that:
- Subject line is 4 words max, no punctuation, no hype
- Body opens with the single most embarrassing content gap (use the hooks — be specific, use their numbers)
- One paragraph only. No bullet points. No sign-off pleasantries.
- The ask is a reply, not a call. Make it dead simple to say yes.`;

  const followUpAddition = followUp
    ? "\n\nThis is a FOLLOW-UP. They didn't reply. Don't apologize for following up. Reference something new — a trend in their niche, a competitor posting content, anything that creates urgency. Keep it shorter than the first message."
    : "";

  const messages = [
    {
      role: "system",
      content: `You write outreach for a short-form content agency that turns existing long-form videos, podcasts, and photos into Shorts, Reels, and TikToks. Your messages get replies because they are specific, brief, and low-friction. You never use filler phrases. You never pitch in the first message. You make the prospect feel like you spotted something they already know is a problem.`
    },
    {
      role: "user",
      content: `Write a ${followUp ? "follow-up" : "first-touch"} ${platform === "email" ? "cold email" : "Instagram/DM message"} for this lead.

Lead name: ${lead.name}
Niche: ${lead.niche || "unknown"}
Handle: ${lead.instagram_handle ? `@${lead.instagram_handle}` : lead.x_handle ? `@${lead.x_handle}` : "unknown"}

Content gap hooks (pick the sharpest ONE):
${hooks.length ? hooks.map((h, i) => `${i + 1}. ${h}`).join("\n") : "No specific hook data — write something honest about the niche having a short-form gap."}

Extra context: ${context || "none"}

${platform === "email" ? emailInstructions : dmInstructions}${followUpAddition}

Return strict JSON only: { subject, message }
For DMs, subject is an empty string.`
    }
  ];

  let result;
  let parsed;
  try {
    result = await completeAI(messages, { json: true, temperature: 0.6 });
    parsed = parseAIJson(result.content);
  } catch (error) {
    console.log(`[ai-service] provider=local-template status=handled detail=${error.message}`);
    const handle = lead.instagram_handle ? `@${lead.instagram_handle}` : lead.x_handle ? `@${lead.x_handle}` : lead.name;
    const bestHook = hooks[0] || `${lead.niche || "your niche"} is one of the fastest-growing short-form categories right now`;
    result = { provider: "local-template" };
    parsed = {
      subject: platform === "email" ? `quick idea for ${lead.name}` : "",
      message:
        platform === "email"
          ? `${lead.name},\n\n${bestHook}\n\nWould it be useful if I sent 3 specific clip ideas from your existing content?\n\n`
          : `Hey ${handle} — ${bestHook.toLowerCase()}\n\nWould 3 ready-to-post clip ideas be useful?`
    };
  }

  return {
    provider: result.provider,
    subject: parsed.subject || "",
    message: parsed.message || ""
  };
}
