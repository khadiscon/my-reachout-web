function normalizeDomain(value = "") {
  try {
    const url = value.startsWith("http") ? new URL(value) : new URL(`https://${value}`);
    return url.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return String(value).replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase();
  }
}

function normalizeName(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(the|llc|inc|co|company|podcast|show|official|studio|studios|gym|fitness)\b/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

function cleanPhone(value = "") {
  return String(value).replace(/\D/g, "");
}

export function getPlatformPresence(lead = {}) {
  const payload = lead.platform_payload || {};
  const followerCounts = lead.follower_counts || {};
  const hasYouTube = Boolean(lead.youtube_url || payload.youtube || followerCounts.youtube);
  const hasInstagram = Boolean(lead.instagram_handle || payload.instagram || followerCounts.instagram);
  const hasMaps = Boolean(payload.mapbox || lead.address || lead.phone || lead.source === "mapbox");
  const present = [
    hasYouTube ? "YouTube" : null,
    hasInstagram ? "Instagram" : null,
    hasMaps ? "Maps" : null
  ].filter(Boolean);
  const missing = ["YouTube", "Instagram", "Maps"].filter((platform) => !present.includes(platform));

  return {
    youtube: hasYouTube,
    instagram: hasInstagram,
    maps: hasMaps,
    present,
    missing,
    platformCount: present.length,
    summary: present.length ? `Found on ${present.join(", ")}` : "No primary platform presence found"
  };
}

export function scoreLeadLocally(lead = {}) {
  const presence = getPlatformPresence(lead);
  const youtube = lead.platform_payload?.youtube || {};
  const instagram = lead.platform_payload?.instagram || {};
  const maps = lead.platform_payload?.mapbox || {};
  const followerCounts = lead.follower_counts || {};

  const shortFormGap =
    presence.youtube && Number(youtube.longVideoCount || 0) > 0 && Number(youtube.recentShortCount || 0) <= 3
      ? 9
      : presence.instagram && Number(instagram.reelCount || 0) <= 3
        ? 8
        : presence.platformCount >= 2
          ? 6
          : 4;

  const moneySignal = Math.min(
    10,
    3 +
      (lead.website ? 1.5 : 0) +
      (lead.email ? 1 : 0) +
      (lead.phone ? 1 : 0) +
      (presence.maps ? 1.5 : 0) +
      (Number(maps.rating || 0) >= 4 ? 1 : 0) +
      (Number(followerCounts.youtube || 0) > 10000 || Number(followerCounts.instagram || 0) > 10000 ? 1 : 0)
  );

  const platformPresence = Math.min(10, 2 + presence.platformCount * 2.3 + (lead.website ? 0.7 : 0));
  const contentWeakness = Math.max(4, Math.min(10, shortFormGap - (presence.platformCount === 3 ? 0.5 : 0) + 1));
  const urgency = Math.min(10, 4 + (shortFormGap >= 8 ? 2 : 0) + (presence.maps ? 1 : 0) + (presence.platformCount >= 2 ? 1 : 0));
  const score = Number(((contentWeakness + shortFormGap + moneySignal + urgency + platformPresence) / 5).toFixed(1));

  return {
    score,
    breakdown: {
      contentWeakness: Number(contentWeakness.toFixed(1)),
      shortFormGap: Number(shortFormGap.toFixed(1)),
      moneySignal: Number(moneySignal.toFixed(1)),
      urgency: Number(urgency.toFixed(1)),
      platformPresence: Number(platformPresence.toFixed(1))
    },
    reasoning: `${presence.summary}. ${presence.missing.length ? `Missing ${presence.missing.join(", ")}, which creates a clear enrichment/outreach angle.` : "Strong cross-platform footprint; pitch a short-form system rather than basic setup."}`
  };
}

export function withPresenceScore(lead = {}) {
  const local = scoreLeadLocally(lead);
  return {
    ...lead,
    ai_score: lead.ai_score || local.score,
    score_breakdown: {
      ...local.breakdown,
      ...(lead.score_breakdown || {})
    },
    score_reason: lead.score_reason || local.reasoning,
    platform_payload: {
      ...(lead.platform_payload || {}),
      presence: getPlatformPresence(lead)
    }
  };
}

function mergeKeys(lead = {}) {
  return [
    lead.email?.toLowerCase(),
    lead.website ? normalizeDomain(lead.website) : "",
    lead.phone ? cleanPhone(lead.phone) : "",
    lead.instagram_handle?.toLowerCase(),
    lead.youtube_url?.toLowerCase(),
    normalizeName(lead.name)
  ].filter(Boolean);
}

function mergeTwoLeads(base, incoming) {
  return {
    ...base,
    name: base.name || incoming.name,
    niche: base.niche || incoming.niche,
    instagram_handle: base.instagram_handle || incoming.instagram_handle,
    youtube_url: base.youtube_url || incoming.youtube_url,
    x_handle: base.x_handle || incoming.x_handle,
    email: base.email || incoming.email,
    phone: base.phone || incoming.phone,
    website: base.website || incoming.website,
    address: base.address || incoming.address,
    source: [...new Set(String(base.source || "").split("+").concat(String(incoming.source || "").split("+")).filter(Boolean))].join("+"),
    follower_counts: {
      ...(base.follower_counts || {}),
      ...(incoming.follower_counts || {})
    },
    platform_payload: {
      ...(base.platform_payload || {}),
      ...(incoming.platform_payload || {})
    },
    notes: [base.notes, incoming.notes].filter(Boolean).join("\n"),
    duplicate_candidates: [
      ...(base.duplicate_candidates || []),
      ...(incoming.duplicate_candidates || [])
    ]
  };
}

export function mergeCrossPlatformLeads(leads = []) {
  const merged = [];

  for (const rawLead of leads) {
    const lead = { ...rawLead };
    const keys = new Set(mergeKeys(lead));
    const matchIndex = merged.findIndex((existing) => mergeKeys(existing).some((key) => keys.has(key)));

    if (matchIndex >= 0) {
      merged[matchIndex] = mergeTwoLeads(merged[matchIndex], lead);
    } else {
      merged.push(lead);
    }
  }

  return merged.map(withPresenceScore);
}
