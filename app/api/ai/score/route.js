import { json, getSupabaseForRequest, normalizeError } from "@/lib/http";
import { scoreLeadWithAI } from "@/lib/ai-service";
import { updateLead } from "@/lib/lead-store";

export async function POST(request) {
  try {
    const body = await request.json();
    const scored = await scoreLeadWithAI(body.lead);
    const updates = {
      ai_score: scored.score,
      score_breakdown: scored.breakdown,
      score_reason: scored.reasoning,
      platform_payload: {
        ...(body.lead.platform_payload || {}),
        presence: scored.presence,
        ai: {
          ...(body.lead.platform_payload?.ai || {}),
          scoreProvider: scored.provider,
          scoredAt: new Date().toISOString()
        }
      }
    };

    const { supabase, user } = await getSupabaseForRequest(request);
    let lead = { ...body.lead, ...updates };

    if (supabase && user && body.lead.id) {
      lead = await updateLead(supabase, user.id, body.lead.id, updates);
    }

    return json({ provider: scored.provider, lead, scored });
  } catch (error) {
    return json({ error: normalizeError(error) }, { status: 500 });
  }
}
