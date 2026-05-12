import { json, getSupabaseForRequest, normalizeError } from "@/lib/http";
import { scoreLeadWithAI } from "@/lib/ai-service";
import { updateLead } from "@/lib/lead-store";
import { enrichLeadDetails } from "@/lib/lead-enrichment";

const ENRICHED_FIELDS = ["instagram_handle", "youtube_url", "x_handle", "email", "phone", "website", "address"];

function enrichmentUpdates(original = {}, enriched = {}) {
  return Object.fromEntries(
    ENRICHED_FIELDS
      .filter((field) => !original[field] && enriched[field])
      .map((field) => [field, enriched[field]])
  );
}

export async function POST(request) {
  try {
    const body = await request.json();
    const enrichedLead = await enrichLeadDetails(body.lead || {});
    const scored = await scoreLeadWithAI(enrichedLead);
    const updates = {
      ...enrichmentUpdates(body.lead, enrichedLead),
      ai_score: scored.score,
      score_breakdown: scored.breakdown,
      score_reason: scored.reasoning,
      platform_payload: {
        ...(enrichedLead.platform_payload || {}),
        presence: scored.presence,
        ai: {
          ...(enrichedLead.platform_payload?.ai || {}),
          scoreProvider: scored.provider,
          scoredAt: new Date().toISOString()
        }
      }
    };

    const { supabase, user } = await getSupabaseForRequest(request);
    let lead = { ...enrichedLead, ...updates };

    if (supabase && user && body.lead.id) {
      lead = await updateLead(supabase, user.id, body.lead.id, updates);
    }

    return json({ provider: scored.provider, lead, scored });
  } catch (error) {
    return json({ error: normalizeError(error) }, { status: 500 });
  }
}
