import { json, getSupabaseForRequest, normalizeError } from "@/lib/http";
import { generateOutreachWithAI } from "@/lib/ai-service";

export async function POST(request) {
  const { supabase, user } = await getSupabaseForRequest(request);

  if (!supabase) {
    return json({ error: "Supabase is not configured." }, { status: 500 });
  }

  if (!user) {
    return json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const dueBefore = body.dueBefore || new Date().toISOString();

    const { data, error } = await supabase
      .from("outreach_statuses")
      .select("*, leads!inner(*)")
      .eq("status", "Sent")
      .lte("next_follow_up_at", dueBefore)
      .eq("leads.user_id", user.id)
      .limit(Math.min(Number(body.limit || 10), 25));

    if (error) throw error;

    const generated = [];
    for (const status of data || []) {
      const result = await generateOutreachWithAI({
        lead: status.leads,
        platform: status.platform,
        followUp: true,
        context: `No reply after 3 days. Previous message: ${status.last_message || "unknown"}`
      });

      const { data: followup, error: followupError } = await supabase
        .from("followups")
        .insert({
          lead_id: status.lead_id,
          outreach_status_id: status.id,
          platform: status.platform,
          due_at: status.next_follow_up_at,
          generated_message: result.message
        })
        .select("*")
        .single();

      if (followupError) throw followupError;

      const count = Number(status.follow_up_count || 0) + 1;
      const { error: statusError } = await supabase
        .from("outreach_statuses")
        .update({
          follow_up_count: count,
          next_follow_up_at: new Date(Date.now() + 3 * 86400000).toISOString()
        })
        .eq("id", status.id);

      if (statusError) throw statusError;

      generated.push({
        followup,
        provider: result.provider,
        lead: status.leads,
        platform: status.platform,
        message: result.message
      });
    }

    return json({ generated });
  } catch (error) {
    return json({ error: normalizeError(error) }, { status: 500 });
  }
}
