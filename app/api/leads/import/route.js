import { json, normalizeError } from "@/lib/http";
import { normalizeInstagramLead, normalizeManualHandle } from "@/lib/source-normalizers";
import { saveLeadsIfRequested } from "@/lib/route-save";
import { mergeCrossPlatformLeads } from "@/lib/platform-presence";

function splitInputs(text = "") {
  return text
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function enrichInstagramHandles(handles, keyword) {
  if (!process.env.APIFY_API_KEY || !handles.length) return [];

  const directUrls = handles.map((handle) => `https://www.instagram.com/${String(handle).replace(/^@/, "")}/`);
  const response = await fetch(
    `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${process.env.APIFY_API_KEY}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ directUrls, resultsType: "details", resultsLimit: handles.length })
    }
  );

  if (!response.ok) return [];
  const items = await response.json();
  return (Array.isArray(items) ? items : []).map((item) => normalizeInstagramLead(item, keyword));
}

export async function POST(request) {
  try {
    const body = await request.json();
    const inputs = Array.isArray(body.items) ? body.items : splitInputs(body.text || "");
    const manual = inputs.map(normalizeManualHandle).filter((lead) => lead.qualifies);
    const instagramHandles = manual.map((lead) => lead.instagram_handle).filter(Boolean);
    const enriched = await enrichInstagramHandles(instagramHandles, body.niche || "manual import");

    const enrichedByHandle = new Map(enriched.map((lead) => [lead.instagram_handle, lead]));
    const leads = mergeCrossPlatformLeads(
      manual.map((lead) => ({
        ...lead,
        niche: body.niche || lead.niche || "",
        ...(lead.instagram_handle && enrichedByHandle.get(lead.instagram_handle)
          ? enrichedByHandle.get(lead.instagram_handle)
          : {})
      }))
    );

    const saveResult = await saveLeadsIfRequested(request, leads, Boolean(body.save));
    return json({ leads, ...saveResult });
  } catch (error) {
    return json({ error: normalizeError(error) }, { status: 500 });
  }
}
