import { json, missingEnvResponse, normalizeError } from "@/lib/http";
import { saveLeadsIfRequested } from "@/lib/route-save";
import { searchInstagramLeads } from "@/lib/source-clients";
import { prepareLeadBatch } from "@/lib/lead-enrichment";

export async function POST(request) {
  if (!process.env.APIFY_API_KEY) {
    return missingEnvResponse(["APIFY_API_KEY"]);
  }

  try {
    const body = await request.json();
    const leads = await prepareLeadBatch(
      await searchInstagramLeads({
        keyword: body.keyword || "business podcast",
        handles: body.handles || [],
        limit: body.limit || 20,
        includeFiltered: body.includeFiltered
      })
    );

    const saveResult = await saveLeadsIfRequested(request, leads, Boolean(body.save));
    return json({ leads, ...saveResult });
  } catch (error) {
    return json({ error: normalizeError(error) }, { status: 500 });
  }
}
