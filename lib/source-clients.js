import { normalizeInstagramLead, normalizeMapsLead, normalizeYoutubeLead } from "@/lib/source-normalizers";

const YOUTUBE_BASE = "https://www.googleapis.com/youtube/v3";

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

export async function searchInstagramLeads({ keyword = "", handles = [], limit = 20, includeFiltered = false }) {
  if (!process.env.APIFY_API_KEY) {
    throw new Error("APIFY_API_KEY is not configured.");
  }

  const usernames = handles
    .map((h) => String(h).trim().replace(/^@/, "").replace(/^https?:\/\/www\.instagram\.com\//, "").replace(/\/$/, ""))
    .filter(Boolean);

  // Profile scraper needs actual usernames — keyword-only search isn't supported by this actor
  if (!usernames.length) return [];

  const response = await fetch(
    `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${process.env.APIFY_API_KEY}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        usernames,
        resultsLimit: Math.min(Number(limit || 20), 100)
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

async function mapboxGeocode(city) {
  const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
  url.searchParams.set("q", city);
  url.searchParams.set("types", "place");
  url.searchParams.set("limit", "1");
  url.searchParams.set("access_token", process.env.MAPBOX_API_KEY);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Mapbox Geocoding failed with ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }

  const data = await response.json();
  const feature = data.features?.[0];
  if (!feature) throw new Error(`Could not find coordinates for city: ${city}`);

  const [lng, lat] = feature.geometry.coordinates;
  return { lat, lng };
}

export async function searchMapsLeads({ category = "fitness studio", city = "Austin", limit = 10 }) {
  if (!process.env.MAPBOX_API_KEY) {
    throw new Error("MAPBOX_API_KEY is not configured.");
  }

  const { lat, lng } = await mapboxGeocode(city);

  const url = new URL("https://api.mapbox.com/search/searchbox/v1/category/" + encodeURIComponent(category));
  url.searchParams.set("access_token", process.env.MAPBOX_API_KEY);
  url.searchParams.set("proximity", `${lng},${lat}`);
  url.searchParams.set("limit", String(Math.min(Number(limit || 10), 25)));
  url.searchParams.set("language", "en");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Mapbox Search Box API failed with ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }

  const data = await response.json();
  const features = data.features || [];

  return features.map((feature) => {
    const props = feature.properties || {};
    const lead = normalizeMapsLead(feature, city);
    lead.niche = category;
    return lead;
  });
}
