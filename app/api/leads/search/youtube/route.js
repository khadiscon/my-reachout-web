import { json, missingEnvResponse, normalizeError } from "@/lib/http";
import { saveLeadsIfRequested } from "@/lib/route-save";
import { searchYoutubeLeads } from "@/lib/source-clients";
import { mergeCrossPlatformLeads } from "@/lib/platform-presence";

export async function POST(request) {
  if (!process.env.YOUTUBE_API_KEY) {
    return missingEnvResponse(["YOUTUBE_API_KEY"]);
  }

  try {
    const body = await request.json();
    const leads = mergeCrossPlatformLeads(
      await searchYoutubeLeads({
        keyword: body.keyword || body.niche || "business podcast",
        limit: body.limit || 8,
        includeFiltered: body.includeFiltered
      })
    );

    const saveResult = await saveLeadsIfRequested(request, leads, Boolean(body.save));
    return json({ leads, ...saveResult });
  } catch (error) {
    return json({ error: normalizeError(error) }, { status: 500 });
  }
}
