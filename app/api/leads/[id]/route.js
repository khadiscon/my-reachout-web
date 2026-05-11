import { json, getSupabaseForRequest, normalizeError } from "@/lib/http";
import { updateLead, updateOutreachStatus } from "@/lib/lead-store";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const { supabase, user } = await getSupabaseForRequest(request);

  if (!supabase) {
    return json({ error: "Supabase is not configured." }, { status: 500 });
  }

  if (!user) {
    return json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (body.outreach) {
      await updateOutreachStatus(
        supabase,
        id,
        body.outreach.platform,
        body.outreach.status,
        body.outreach.extra || {}
      );
    }

    const lead = body.lead ? await updateLead(supabase, user.id, id, body.lead) : null;
    return json({ lead });
  } catch (error) {
    return json({ error: normalizeError(error) }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const { supabase, user } = await getSupabaseForRequest(request);

  if (!supabase) {
    return json({ error: "Supabase is not configured." }, { status: 500 });
  }

  if (!user) {
    return json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const { error } = await supabase.from("leads").delete().eq("id", id).eq("user_id", user.id);
    if (error) throw error;
    return json({ ok: true });
  } catch (error) {
    return json({ error: normalizeError(error) }, { status: 500 });
  }
}
