import { json, missingEnvResponse, normalizeError } from "@/lib/http";
import { saveLeadsIfRequested } from "@/lib/route-save";
import { searchInstagramLeads } from "@/lib/source-clients";
import { mergeCrossPlatformLeads } from "@/lib/platform-presence";

export async function POST(request) {
  if (!process.env.APIFY_API_KEY) {
    return missingEnvResponse(["APIFY_API_KEY"]);
  }

  try {
    const body = await request.json();
    const handles = body.handles || [];
    if (!handles.length) {
      return json({ leads: [], message: "Instagram search requires @handles. Enter one or more Instagram handles to look up." });
    }

    const leads = mergeCrossPlatformLeads(
      await searchInstagramLeads({
        keyword: body.keyword || "",
        handles,
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
