import { cleanHandle } from "@/lib/lead-utils";
import { mergeCrossPlatformLeads, withPresenceScore } from "@/lib/platform-presence";

const MIN_CONFIDENCE = 0.8;
const USER_AGENT = "ShortsAgencyOS/1.0 lead-enrichment";
const BLOCKED_DOMAINS = new Set([
  "facebook.com",
  "fb.com",
  "google.com",
  "maps.google.com",
  "youtube.com",
  "youtu.be",
  "instagram.com",
  "x.com",
  "twitter.com",
  "linkedin.com",
  "tiktok.com"
]);

function stripHtml(value = "") {
  return String(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x2F;|&#47;/g, "/")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(value = "") {
  const trimmed = String(value || "").trim().replace(/[),.;]+$/g, "");
  if (!trimmed) return "";
  if (/^mailto:/i.test(trimmed)) return trimmed.replace(/^mailto:/i, "").split("?")[0];
  if (/^tel:/i.test(trimmed)) return trimmed.replace(/^tel:/i, "");
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^www\./i.test(trimmed)) return `https://${trimmed}`;
  return "";
}

function domainOf(value = "") {
  try {
    return new URL(normalizeUrl(value)).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function isBlockedWebsite(url = "") {
  const domain = domainOf(url);
  return !domain || [...BLOCKED_DOMAINS].some((blocked) => domain === blocked || domain.endsWith(`.${blocked}`));
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function extractUrls(text = "") {
  const urls = [];
  const raw = String(text || "");
  for (const match of raw.matchAll(/\bhttps?:\/\/[^\s"'<>]+|\bwww\.[^\s"'<>]+/gi)) {
    urls.push(normalizeUrl(match[0]));
  }
  for (const match of raw.matchAll(/\b(?:href|content)=["']([^"']+)["']/gi)) {
    urls.push(normalizeUrl(match[1]));
  }
  return unique(urls);
}

function extractEmails(text = "") {
  return unique(
    String(text || "")
      .match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)
      ?.filter((email) => !/(example\.|noreply|no-reply|privacy@|support@wix|sentry\.io)/i.test(email)) || []
  );
}

function extractPhones(text = "") {
  return unique(
    String(text || "")
      .match(/(?:\+?\d[\d\s().-]{7,}\d)/g)
      ?.map((phone) => phone.trim())
      .filter((phone) => {
        const digits = phone.replace(/\D/g, "");
        return digits.length >= 10 && digits.length <= 15;
      }) || []
  );
}

function extractSocials(text = "") {
  const urls = extractUrls(text);
  const socials = {};

  for (const url of urls) {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      continue;
    }

    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    const parts = parsed.pathname.split("/").filter(Boolean);
    const first = parts[0] || "";

    if (host === "instagram.com" && first && !/^(p|reel|tv|stories|explore|accounts)$/i.test(first)) {
      socials.instagram_handle ||= cleanHandle(first);
    }
    if ((host === "x.com" || host === "twitter.com") && first && !/^(i|share|intent|home|search)$/i.test(first)) {
      socials.x_handle ||= cleanHandle(first);
    }
    if (host === "youtube.com" || host === "youtu.be") {
      if (parsed.pathname.startsWith("/@") || /^\/(channel|c|user)\//.test(parsed.pathname)) {
        socials.youtube_url ||= url;
      }
    }
  }

  return socials;
}

function extractPublicWebsite(text = "") {
  return extractUrls(text).find((url) => /^https?:\/\//i.test(url) && !isBlockedWebsite(url)) || "";
}

function collectTextSources(lead = {}) {
  const payload = lead.platform_payload || {};
  return [
    {
      source: "youtube-description",
      confidence: 0.86,
      text: payload.youtube?.description
    },
    {
      source: "instagram-bio",
      confidence: 0.86,
      text: `${payload.instagram?.bio || ""} ${payload.instagram?.contactLink || ""}`
    },
    {
      source: "manual-input",
      confidence: 0.82,
      text: payload.manual?.input
    }
  ].filter((item) => item.text);
}

function noteEnrichment(lead, field, value, confidence, source) {
  return {
    ...lead,
    platform_payload: {
      ...(lead.platform_payload || {}),
      enrichment: [
        ...(lead.platform_payload?.enrichment || []),
        {
          field,
          value,
          confidence,
          source,
          enrichedAt: new Date().toISOString()
        }
      ]
    }
  };
}

function applyField(lead, field, value, confidence, source) {
  if (!value || confidence < MIN_CONFIDENCE || lead[field]) return lead;
  const normalized = field === "instagram_handle" || field === "x_handle" ? cleanHandle(value) : value;
  return noteEnrichment({ ...lead, [field]: normalized }, field, normalized, confidence, source);
}

function applyExtracted(lead, text, confidence, source) {
  const cleanText = stripHtml(text);
  const socials = extractSocials(text);
  let next = lead;

  next = applyField(next, "email", extractEmails(cleanText)[0], confidence, source);
  next = applyField(next, "phone", extractPhones(cleanText)[0], confidence, source);
  next = applyField(next, "website", extractPublicWebsite(text), confidence, source);
  next = applyField(next, "instagram_handle", socials.instagram_handle, confidence, source);
  next = applyField(next, "x_handle", socials.x_handle, confidence, source);
  next = applyField(next, "youtube_url", socials.youtube_url, confidence, source);

  return next;
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": USER_AGENT, accept: "text/html,text/plain;q=0.9,*/*;q=0.5" }
    });
    if (!response.ok) return "";
    const type = response.headers.get("content-type") || "";
    if (type && !/text|html|xml/i.test(type)) return "";
    return (await response.text()).slice(0, 250000);
  } catch {
    return "";
  } finally {
    clearTimeout(timeout);
  }
}

function contactUrls(baseUrl, html = "") {
  const base = new URL(baseUrl);
  const candidates = [];

  for (const rawUrl of extractUrls(html)) {
    try {
      const url = new URL(rawUrl, base);
      const path = url.pathname.toLowerCase();
      if (url.hostname === base.hostname && /(contact|about|team|connect)/.test(path)) {
        candidates.push(url.href);
      }
    } catch {
      // Ignore malformed site links.
    }
  }

  for (const path of ["/contact", "/contact-us", "/about"]) {
    candidates.push(new URL(path, base).href);
  }

  return unique(candidates).slice(0, 2);
}

async function enrichFromWebsite(lead = {}) {
  if (!lead.website || isBlockedWebsite(lead.website)) return lead;

  const homepage = normalizeUrl(lead.website);
  const html = await fetchText(homepage);
  if (!html) return lead;

  let next = applyExtracted(lead, html, 0.94, "official-website");
  const stillMissing = !next.email || !next.phone || !next.instagram_handle || !next.youtube_url || !next.x_handle;
  if (!stillMissing) return next;

  const pages = await Promise.all(contactUrls(homepage, html).map((url) => fetchText(url)));
  for (const page of pages.filter(Boolean)) {
    next = applyExtracted(next, page, 0.94, "official-website-contact-page");
  }

  return next;
}

export async function enrichLeadDetails(lead = {}, options = {}) {
  let next = { ...lead };

  for (const source of collectTextSources(next)) {
    next = applyExtracted(next, source.text, source.confidence, source.source);
  }

  if (options.websiteFetch !== false) {
    next = await enrichFromWebsite(next);
  }

  return withPresenceScore(next);
}

export async function enrichLeadBatch(leads = [], options = {}) {
  const concurrency = Math.max(1, Math.min(Number(options.concurrency || 4), 6));
  const websiteFetchLimit = Number(options.websiteFetchLimit ?? 8);
  const results = [];
  let websiteFetches = 0;

  for (let index = 0; index < leads.length; index += concurrency) {
    const chunk = leads.slice(index, index + concurrency).map((lead) => {
      const allowWebsiteFetch = options.websiteFetch !== false && websiteFetches < websiteFetchLimit;
      if (allowWebsiteFetch) websiteFetches += 1;
      return { lead, options: { ...options, websiteFetch: allowWebsiteFetch } };
    });
    results.push(...(await Promise.all(chunk.map((item) => enrichLeadDetails(item.lead, item.options)))));
  }

  return results;
}

export async function prepareLeadBatch(rawLeads = [], options = {}) {
  const merged = mergeCrossPlatformLeads(rawLeads);
  return enrichLeadBatch(merged, options);
}
