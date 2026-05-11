export const PIPELINE_STAGES = ["Prospect", "Contacted", "Replied", "Booked", "Closed"];
export const OUTREACH_STATUSES = ["Not Contacted", "Sent", "Replied", "Booked", "Closed"];
export const PLATFORMS = ["instagram", "youtube", "x", "email", "phone", "website"];

export function cleanHandle(handle = "") {
  return String(handle).trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "");
}

export function inferPipelineStage(statuses = []) {
  const rank = {
    Closed: "Closed",
    Booked: "Booked",
    Replied: "Replied",
    Sent: "Contacted",
    "Not Contacted": "Prospect"
  };
  const ordered = ["Closed", "Booked", "Replied", "Sent", "Not Contacted"];
  const found = ordered.find((status) => statuses.some((item) => item.status === status));
  return rank[found] || "Prospect";
}

export function getLeadSignature(lead) {
  return [
    lead.email?.toLowerCase(),
    cleanHandle(lead.instagram_handle || lead.instagramHandle).toLowerCase(),
    cleanHandle(lead.x_handle || lead.xHandle).toLowerCase(),
    lead.youtube_url || lead.youtubeUrl,
    lead.website?.toLowerCase()
  ].filter(Boolean);
}

export function findDuplicateCandidates(newLead, leads = []) {
  const signature = new Set(getLeadSignature(newLead));
  if (!signature.size) return [];

  return leads
    .filter((lead) => getLeadSignature(lead).some((value) => signature.has(value)))
    .map((lead) => ({
      id: lead.id,
      name: lead.name,
      matchedOn: getLeadSignature(lead).filter((value) => signature.has(value))
    }));
}

export function compactLead(lead) {
  return {
    id: lead.id,
    name: lead.name,
    niche: lead.niche,
    instagram_handle: lead.instagram_handle,
    youtube_url: lead.youtube_url,
    x_handle: lead.x_handle,
    email: lead.email,
    phone: lead.phone,
    website: lead.website,
    address: lead.address,
    source: lead.source,
    follower_counts: lead.follower_counts || {},
    platform_payload: lead.platform_payload || {},
    ai_score: lead.ai_score,
    score_breakdown: lead.score_breakdown || {},
    score_reason: lead.score_reason,
    notes: lead.notes,
    pipeline_stage: lead.pipeline_stage || "Prospect",
    duplicate_candidates: lead.duplicate_candidates || [],
    deal_value: Number(lead.deal_value || 0),
    outreach_statuses: lead.outreach_statuses || []
  };
}
