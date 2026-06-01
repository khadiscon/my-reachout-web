import { cleanHandle } from "@/lib/lead-utils";

export function parseDurationToSeconds(duration = "") {
  const match = duration.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const [, days = 0, hours = 0, minutes = 0, seconds = 0] = match.map((value) => Number(value || 0));
  return days * 86400 + hours * 3600 + minutes * 60 + seconds;
}

export function extractEmail(text = "") {
  return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
}

export function normalizeYoutubeLead(channel, videos = []) {
  const longVideos = videos.filter((video) => parseDurationToSeconds(video.contentDetails?.duration) >= 1800);
  const shorts = videos.filter((video) => parseDurationToSeconds(video.contentDetails?.duration) <= 60);
  const subscribers = Number(channel.statistics?.subscriberCount || 0);
  const description = channel.snippet?.description || "";

  return {
    name: channel.snippet?.title || "Untitled YouTube channel",
    niche: "",
    youtube_url: `https://www.youtube.com/channel/${channel.id}`,
    email: extractEmail(description),
    profile_image: channel.snippet?.thumbnails?.high?.url || channel.snippet?.thumbnails?.medium?.url || channel.snippet?.thumbnails?.default?.url || "",
    source: "youtube",
    follower_counts: {
      youtube: subscribers
    },
    platform_payload: {
      youtube: {
        description,
        longVideoCount: longVideos.length,
        recentShortCount: shorts.length,
        videoSample: videos.slice(0, 5).map((video) => ({
          title: video.snippet?.title,
          duration: video.contentDetails?.duration
        }))
      }
    },
    qualifies: subscribers >= 1000 && subscribers <= 500000 && longVideos.length > 0 && shorts.length <= 3
  };
}

export function normalizeInstagramLead(profile, keyword = "") {
  const handle = cleanHandle(profile.username || profile.handle || profile.input);
  const bio = profile.biography || profile.bio || "";
  const followers = Number(profile.followersCount || profile.followers || 0);
  const posts = Number(profile.postsCount || profile.posts || 0);
  const latest = profile.latestPosts?.[0]?.timestamp || profile.latestPostDate || profile.lastPostDate;
  const hasBusinessIntent = /podcast|coach|founder|business|book|course|consult|fitness|agency|real estate|advisor/i.test(`${bio} ${keyword}`);

  return {
    name: profile.fullName || profile.name || handle || "Instagram profile",
    niche: keyword,
    instagram_handle: handle,
    website: profile.externalUrl || profile.url || "",
    profile_image: profile.profilePicUrl || profile.profilePicUrlHD || profile.profile_pic_url || "",
    source: "instagram",
    follower_counts: {
      instagram: followers
    },
    platform_payload: {
      instagram: {
        bio,
        posts,
        latest,
        reelCount: profile.reelsCount || profile.highlightReelCount || 0,
        isBusinessAccount: profile.isBusinessAccount,
        contactLink: profile.externalUrl || profile.url || ""
      }
    },
    qualifies: Boolean(handle && hasBusinessIntent)
  };
}

export function normalizeMapsLead(feature, city = "") {
  const props = feature.properties || {};
  const coords = feature.geometry?.coordinates || [];
  const context = props.context || {};

  const address = [
    props.full_address ||
    [props.address, context.place?.name || city].filter(Boolean).join(", ")
  ].filter(Boolean).join("");

  return {
    name: props.name || "Local business",
    niche: "",
    phone: props.metadata?.phone || "",
    website: props.metadata?.website || "",
    address,
    source: "mapbox",
    follower_counts: {},
    platform_payload: {
      mapbox: {
        mapboxId: props.mapbox_id,
        category: props.poi_category?.join(", ") || "",
        lat: coords[1],
        lng: coords[0],
        city: context.place?.name || city
      }
    },
    qualifies: true
  };
}

export function normalizeManualHandle(value) {
  const raw = String(value || "").trim();
  const isInstagram = /instagram\.com|^@?[\w.]+$/i.test(raw);
  const isX = /x\.com|twitter\.com/i.test(raw);
  const handle = cleanHandle(raw.replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//, ""));

  return {
    name: handle || raw,
    instagram_handle: isInstagram && !isX ? handle : "",
    x_handle: isX ? handle : "",
    source: "manual",
    follower_counts: {},
    platform_payload: {
      manual: {
        input: raw
      }
    },
    qualifies: Boolean(handle)
  };
}
