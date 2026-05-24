import { json, normalizeError } from "@/lib/http";
import { saveLeadsIfRequested } from "@/lib/route-save";
import { mergeCrossPlatformLeads } from "@/lib/platform-presence";
import { searchInstagramLeads, searchMapsLeads, searchYoutubeLeads } from "@/lib/source-clients";

async function settleSource(name, callback) {
  try {
    return { name, ok: true, leads: await callback() };
  } catch (error) {
    return { name, ok: false, leads: [], error: error.message };
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const keyword = body.keyword || body.niche || "business podcast";
    const city = body.city || "Austin";
    const category = body.category || keyword;
    const limit = Math.min(Number(body.limit || 8), 20);

    const results = await Promise.all([
      settleSource("youtube", () =>
        searchYoutubeLeads({
          keyword,
          limit,
          includeFiltered: true
        })
      ),
      settleSource("instagram", () =>
        searchInstagramLeads({
          keyword,
          limit: limit * 2,
          includeFiltered: true
        })
      ),
      settleSource("maps", () =>
        searchMapsLeads({
          category,
          city,
          limit
        })
      )
    ]);

    const rawLeads = results.flatMap((result) => result.leads);
    const leads = mergeCrossPlatformLeads(rawLeads);
    const saveResult = await saveLeadsIfRequested(request, leads, Boolean(body.save));

    return json({
      leads,
      ...saveResult,
      sourceResults: results.map(({ name, ok, leads: sourceLeads, error }) => ({
        name,
        ok,
        count: sourceLeads.length,
        error
      }))
    });
  } catch (error) {
    return json({ error: normalizeError(error) }, { status: 500 });
  }
}
