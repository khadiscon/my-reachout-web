import { getSupabaseForRequest } from "@/lib/http";
import { createLead } from "@/lib/lead-store";

export async function saveLeadsIfRequested(request, leads, shouldSave) {
  if (!shouldSave) {
    return { saved: [], configured: false };
  }

  const { supabase, user } = await getSupabaseForRequest(request);
  if (!supabase || !user) {
    return { saved: [], configured: Boolean(supabase), error: "Sign in with Supabase to save leads." };
  }

  const saved = [];
  for (const lead of leads) {
    saved.push(await createLead(supabase, user.id, lead));
  }

  return { saved, configured: true };
}
