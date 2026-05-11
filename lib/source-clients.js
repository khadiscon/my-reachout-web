import { normalizeInstagramLead, normalizeMapsLead, normalizeYoutubeLead } from "@/lib/source-normalizers";

const YOUTUBE_BASE = "https://www.googleapis.com/youtube/v3";
const MAPS_BASE = "https://maps.googleapis.com/maps/api/place";

async function youtube(path, params) {
  const url = new URL(`${YOUTUBE_BASE}/${path}`);
  Object.entries({ ...params, key: process.env.YOUTUBE_API_KEY }).forEach(([key, value]) => {
    if (value !== undefined && value !== "") url.searchParams.set(key, value);
  });

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`YouTube API failed with ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }
  return response.json();
}

async function recentVideosForChannel(channelId) {
  const search = await youtube("search", {
    part: "snippet",
    type: "video",
    channelId,
    order: "date",
    maxResults: 20
  });

  const ids = (search.items || []).map((item) => item.id?.videoId).filter(Boolean);
  if (!ids.length) return [];

  const videos = await youtube("videos", {
    part: "snippet,contentDetails,statistics",
    id: ids.join(","),
    maxResults: 20
  });

  return videos.items || [];
}

export async function searchYoutubeLeads({ keyword = "business podcast", limit = 8, includeFiltered = false }) {
  if (!process.env.YOUTUBE_API_KEY) {
    throw new Error("YOUTUBE_API_KEY is not configured.");
  }

  const channelSearch = await youtube("search", {
    part: "snippet",
    type: "channel",
    q: keyword,
    maxResults: Math.min(Number(limit || 8), 20)
  });

  const channelIds = (channelSearch.items || []).map((item) => item.id?.channelId).filter(Boolean);
  if (!channelIds.length) return [];

  const channelData = await youtube("channels", {
    part: "snippet,statistics,contentDetails",
    id: channelIds.join(",")
  });

  const leads = [];
  for (const channel of channelData.items || []) {
    const videos = await recentVideosForChannel(channel.id);
    const lead = normalizeYoutubeLead(channel, videos);
    lead.niche = keyword;
    if (lead.qualifies || includeFiltered) leads.push(lead);
  }

  return leads;
}

function toDirectUrls(handles = []) {
  return handles
    .map((handle) => String(handle).trim().replace(/^@/, ""))
    .filter(Boolean)
    .map((handle) => (handle.startsWith("http") ? handle : `https://www.instagram.com/${handle}/`));
}

export async function searchInstagramLeads({ keyword = "business podcast", handles = [], limit = 20, includeFiltered = false }) {
  if (!process.env.APIFY_API_KEY) {
    throw new Error("APIFY_API_KEY is not configured.");
  }

  const directUrls = toDirectUrls(handles);
  const response = await fetch(
    `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${process.env.APIFY_API_KEY}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        directUrls,
        search: directUrls.length ? undefined : keyword,
        resultsLimit: Math.min(Number(limit || 20), 100),
        resultsType: "details"
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Apify Instagram scraper failed with ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }

  const items = await response.json();
  return (Array.isArray(items) ? items : [])
    .map((item) => normalizeInstagramLead(item, keyword))
    .filter((lead) => lead.qualifies || includeFiltered);
}

async function maps(path, params) {
  const url = new URL(`${MAPS_BASE}/${path}/json`);
  Object.entries({ ...params, key: process.env.GOOGLE_MAPS_API_KEY }).forEach(([key, value]) => {
    if (value !== undefined && value !== "") url.searchParams.set(key, value);
  });

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Google Maps API failed with ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }

  const data = await response.json();
  if (data.status && !["OK", "ZERO_RESULTS"].includes(data.status)) {
    throw new Error(`Google Maps API returned ${data.status}: ${data.error_message || "No detail"}`);
  }
  return data;
}

export async function searchMapsLeads({ category = "fitness studio", city = "Austin", limit = 10 }) {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    throw new Error("GOOGLE_MAPS_API_KEY is not configured.");
  }

  const search = await maps("textsearch", {
    query: `${category} in ${city}`
  });

  const leads = [];
  for (const place of (search.results || []).slice(0, Math.min(Number(limit || 10), 20))) {
    let details = {};
    if (place.place_id) {
      const detailResponse = await maps("details", {
        place_id: place.place_id,
        fields: "name,formatted_phone_number,international_phone_number,website,formatted_address,types"
      });
      details = detailResponse.result || {};
    }
    const lead = normalizeMapsLead(place, details);
    lead.niche = category;
    leads.push(lead);
  }

  return leads;
}
