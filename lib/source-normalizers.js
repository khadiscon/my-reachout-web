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

function bestThumbnail(thumbnails = {}) {
  return thumbnails.maxres?.url || thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url || "";
}

function instagramAvatar(profile = {}) {
  return (
    profile.profilePicUrlHD ||
    profile.profile_pic_url_hd ||
    profile.profilePicUrl ||
    profile.profile_pic_url ||
    profile.profilePictureUrl ||
    profile.profilePicture ||
    profile.avatarUrl ||
    ""
  );
}

export function normalizeYoutubeLead(channel, videos = []) {
  const longVideos = videos.filter((video) => parseDurationToSeconds(video.contentDetails?.duration) >= 1800);
  const shorts = videos.filter((video) => parseDurationToSeconds(video.contentDetails?.duration) <= 60);
  const subscribers = Number(channel.statistics?.subscriberCount || 0);
  const description = channel.snippet?.description || "";
  const avatarUrl = bestThumbnail(channel.snippet?.thumbnails);

  return {
    name: channel.snippet?.title || "Untitled YouTube channel",
    niche: "",
    avatar_url: avatarUrl,
    youtube_url: `https://www.youtube.com/channel/${channel.id}`,
    email: extractEmail(description),
    source: "youtube",
    follower_counts: {
      youtube: subscribers
    },
    platform_payload: {
      youtube: {
        avatarUrl,
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
  const handle = cleanHandle(profile.username || profile.handle || profile.input || profile.inputUrl || profile.profileUrl || profile.url);
  const bio = profile.biography || profile.bio || profile.fullBiography || "";
  const bioLinks = Array.isArray(profile.bio_links) ? profile.bio_links : Array.isArray(profile.bioLinks) ? profile.bioLinks : [];
  const externalUrl =
    profile.externalUrl ||
    profile.external_url ||
    profile.external_url_linkshimmed ||
    profile.externalUrlLinkshimmed ||
    profile.website ||
    bioLinks[0]?.url ||
    bioLinks[0]?.lynx_url ||
    "";
  const followers = Number(profile.followersCount || profile.followers || profile.followers_count || 0);
  const posts = Number(profile.postsCount || profile.posts || profile.post_count || profile.media_count || 0);
  const latest =
    profile.latestPosts?.[0]?.timestamp ||
    profile.latest_posts?.[0]?.timestamp ||
    profile.latestPostDate ||
    profile.lastPostDate;
  const avatarUrl = instagramAvatar(profile);
  const hasBusinessIntent = /podcast|coach|founder|business|book|course|consult|fitness|agency|real estate|advisor/i.test(`${bio} ${keyword}`);
  const businessEmail = profile.businessEmail || profile.business_email || "";
  const businessPhone = profile.businessPhoneNumber || profile.business_phone_number || "";

  return {
    name: profile.fullName || profile.full_name || profile.name || handle || "Instagram profile",
    niche: keyword,
    avatar_url: avatarUrl,
    instagram_handle: handle,
    email: businessEmail || extractEmail(bio),
    phone: businessPhone,
    website: externalUrl,
    source: "instagram",
    follower_counts: {
      instagram: followers
    },
    platform_payload: {
      instagram: {
        avatarUrl,
        bio,
        posts,
        latest,
        reelCount: profile.reelsCount || profile.highlightReelCount || 0,
        isBusinessAccount: profile.isBusinessAccount || profile.is_business_account,
        category: profile.categoryName || profile.category_name || profile.businessCategoryName || profile.business_category_name || "",
        contactLink: externalUrl,
        profileUrl: profile.profileUrl || profile.url || profile.inputUrl || (handle ? `https://www.instagram.com/${handle}/` : "")
      }
    },
    qualifies: Boolean(handle && hasBusinessIntent)
  };
}

export function normalizeMapsLead(place, details = {}) {
  return {
    name: place.name || details.name || "Local business",
    niche: "",
    avatar_url: place.icon || "",
    phone: details.formatted_phone_number || details.international_phone_number || "",
    website: details.website || "",
    address: place.formatted_address || details.formatted_address || "",
    source: "google_maps",
    follower_counts: {},
    platform_payload: {
      googleMaps: {
        avatarUrl: place.icon || "",
        rating: place.rating,
        userRatingsTotal: place.user_ratings_total,
        placeId: place.place_id,
        types: place.types || details.types || []
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
