import { json, missingEnvResponse, normalizeError } from "@/lib/http";
import { saveLeadsIfRequested } from "@/lib/route-save";
import { searchMapsLeads } from "@/lib/source-clients";
import { mergeCrossPlatformLeads } from "@/lib/platform-presence";

export async function POST(request) {
  if (!process.env.MAPBOX_API_KEY) {
    return missingEnvResponse(["MAPBOX_API_KEY"]);
  }

  try {
    const body = await request.json();
    const leads = mergeCrossPlatformLeads(
      await searchMapsLeads({
        category: body.category || "fitness studio",
        city: body.city || "Austin",
        limit: body.limit || 10
      })
    );

    const saveResult = await saveLeadsIfRequested(request, leads, Boolean(body.save));
    return json({ leads, ...saveResult });
  } catch (error) {
    return json({ error: normalizeError(error) }, { status: 500 });
  }
}
