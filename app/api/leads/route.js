import { json, getSupabaseForRequest, normalizeError } from "@/lib/http";
import { createLead, fetchLeads } from "@/lib/lead-store";

export async function GET(request) {
  const { supabase, user } = await getSupabaseForRequest(request);

  if (!supabase) {
    return json({ configured: false, leads: [] });
  }

  if (!user) {
    return json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const leads = await fetchLeads(supabase, user.id);
    return json({ configured: true, leads });
  } catch (error) {
    return json({ error: normalizeError(error) }, { status: 500 });
  }
}

export async function POST(request) {
  const { supabase, user } = await getSupabaseForRequest(request);

  if (!supabase) {
    return json({ error: "Supabase is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY." }, { status: 500 });
  }

  if (!user) {
    return json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const lead = await createLead(supabase, user.id, body);
    return json({ lead }, { status: 201 });
  } catch (error) {
    return json({ error: normalizeError(error) }, { status: 500 });
  }
}
