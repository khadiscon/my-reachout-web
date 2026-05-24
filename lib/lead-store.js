import { compactLead, findDuplicateCandidates, PLATFORMS } from "@/lib/lead-utils";
import { withPresenceScore } from "@/lib/platform-presence";

const DEFAULT_STATUS = "Not Contacted";

export function leadSelect() {
  return `
    *,
    outreach_statuses (*)
  `;
}

export async function fetchLeads(supabase, userId) {
  const { data, error } = await supabase
    .from("leads")
    .select(leadSelect())
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(compactLead);
}

export async function ensureOutreachRows(supabase, leadId, lead) {
  const platforms = [];
  if (lead.instagram_handle) platforms.push("instagram");
  if (lead.youtube_url) platforms.push("youtube");
  if (lead.x_handle) platforms.push("x");
  if (lead.email) platforms.push("email");
  if (lead.phone) platforms.push("phone");
  if (lead.website) platforms.push("website");

  const rows = [...new Set(platforms.length ? platforms : ["instagram"])].map((platform) => ({
    lead_id: leadId,
    platform,
    status: DEFAULT_STATUS
  }));

  if (!rows.length) return [];

  const { data, error } = await supabase
    .from("outreach_statuses")
    .upsert(rows, { onConflict: "lead_id,platform", ignoreDuplicates: true })
    .select("*");

  if (error) throw error;
  return data || [];
}

export async function createLead(supabase, userId, leadInput) {
  const scoredInput = withPresenceScore(leadInput);
  const existing = await fetchLeads(supabase, userId);
  const duplicateCandidates = findDuplicateCandidates(scoredInput, existing);

  const payload = {
    user_id: userId,
    name: scoredInput.name || scoredInput.instagram_handle || scoredInput.x_handle || "Untitled lead",
    niche: scoredInput.niche || "",
    instagram_handle: scoredInput.instagram_handle || "",
    youtube_url: scoredInput.youtube_url || "",
    x_handle: scoredInput.x_handle || "",
    email: scoredInput.email || "",
    phone: scoredInput.phone || "",
    website: scoredInput.website || "",
    address: scoredInput.address || "",
    source: scoredInput.source || "manual",
    follower_counts: scoredInput.follower_counts || {},
    platform_payload: scoredInput.platform_payload || {},
    ai_score: scoredInput.ai_score || null,
    score_breakdown: scoredInput.score_breakdown || {},
    score_reason: scoredInput.score_reason || "",
    notes: scoredInput.notes || "",
    pipeline_stage: scoredInput.pipeline_stage || "Prospect",
    duplicate_candidates: duplicateCandidates,
    deal_value: Number(scoredInput.deal_value || 0)
  };

  const { data, error } = await supabase.from("leads").insert(payload).select(leadSelect()).single();
  if (error) throw error;

  await ensureOutreachRows(supabase, data.id, data);

  const { data: hydrated, error: hydrateError } = await supabase.from("leads").select(leadSelect()).eq("id", data.id).single();
  if (hydrateError) throw hydrateError;
  return compactLead(hydrated);
}

export async function updateLead(supabase, userId, leadId, updates) {
  const allowed = [
    "name",
    "niche",
    "instagram_handle",
    "youtube_url",
    "x_handle",
    "email",
    "phone",
    "website",
    "address",
    "follower_counts",
    "platform_payload",
    "ai_score",
    "score_breakdown",
    "score_reason",
    "notes",
    "pipeline_stage",
    "duplicate_candidates",
    "deal_value"
  ];

  const payload = Object.fromEntries(Object.entries(updates).filter(([key]) => allowed.includes(key)));
  const { data, error } = await supabase
    .from("leads")
    .update(payload)
    .eq("id", leadId)
    .eq("user_id", userId)
    .select(leadSelect())
    .single();

  if (error) throw error;
  await ensureOutreachRows(supabase, data.id, data);
  return compactLead(data);
}

export async function updateOutreachStatus(supabase, leadId, platform, status, extra = {}) {
  if (!PLATFORMS.includes(platform)) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  const now = new Date().toISOString();
  const payload = {
    lead_id: leadId,
    platform,
    status,
    last_message: extra.last_message,
    last_contacted_at: status === "Sent" ? now : extra.last_contacted_at,
    reply_received_at: status === "Replied" ? now : extra.reply_received_at,
    next_follow_up_at: status === "Sent" ? new Date(Date.now() + 3 * 86400000).toISOString() : extra.next_follow_up_at,
    follow_up_count: extra.follow_up_count
  };

  Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);

  const { data, error } = await supabase
    .from("outreach_statuses")
    .upsert(payload, { onConflict: "lead_id,platform" })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
