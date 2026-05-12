"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AtSign,
  BarChart3,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronUp,
  Clipboard,
  Copy,
  DollarSign,
  ExternalLink,
  Flame,
  Heart,
  Home,
  Instagram,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  UserPlus,
  Users,
  X,
  Youtube,
  Zap
} from "lucide-react";
import clsx from "clsx";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { PIPELINE_STAGES, PLATFORMS, inferPipelineStage, productionLeads as withoutPlaceholderLeads } from "@/lib/lead-utils";
import { getPlatformPresence } from "@/lib/platform-presence";

const sourceOptions = [
  { id: "auto", label: "Auto", icon: Zap },
  { id: "youtube", label: "YouTube", icon: Youtube },
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "maps", label: "Maps", icon: MapPin },
  { id: "manual", label: "Paste", icon: Clipboard }
];

const navItems = [
  { id: "feed", label: "Leads", icon: Home },
  { id: "hunt", label: "Find", icon: Search },
  { id: "dms", label: "Messages", icon: MessageCircle },
  { id: "pipeline", label: "Close", icon: BarChart3 }
];

const statusOptions = ["Not Contacted", "Sent", "Replied", "Booked", "Closed"];

const initialLeads = [];

function formatCount(value) {
  const number = Number(value || 0);
  if (number >= 1000000) return `${(number / 1000000).toFixed(1)}M`;
  if (number >= 1000) return `${(number / 1000).toFixed(1)}K`;
  return String(number);
}

function leadAvatarUrl(lead = {}) {
  return (
    lead.avatar_url ||
    lead.profile_image_url ||
    lead.platform_payload?.instagram?.avatarUrl ||
    lead.platform_payload?.youtube?.avatarUrl ||
    lead.platform_payload?.googleMaps?.avatarUrl ||
    lead.platform_payload?.maps?.avatarUrl ||
    ""
  );
}

function normalizeExternalUrl(url = "") {
  const value = String(url || "").trim();
  if (!value) return "";
  if (/^(https?:|mailto:|tel:)/i.test(value)) return value;
  return `https://${value}`;
}

function leadLinks(lead = {}) {
  const links = [];
  if (lead.instagram_handle) {
    links.push({
      id: "instagram",
      label: "Instagram",
      url: `https://www.instagram.com/${String(lead.instagram_handle).replace(/^@/, "")}/`,
      icon: Instagram
    });
  }
  if (lead.youtube_url) {
    links.push({ id: "youtube", label: "YouTube", url: normalizeExternalUrl(lead.youtube_url), icon: Youtube });
  }
  if (lead.x_handle) {
    links.push({
      id: "x",
      label: "X",
      url: `https://x.com/${String(lead.x_handle).replace(/^@/, "")}`,
      icon: AtSign
    });
  }
  if (lead.website) {
    links.push({ id: "website", label: "Website", url: normalizeExternalUrl(lead.website), icon: ExternalLink });
  }
  if (lead.email) {
    links.push({ id: "email", label: "Email", url: `mailto:${lead.email}`, icon: Mail });
  }
  if (lead.phone) {
    links.push({ id: "phone", label: "Call", url: `tel:${lead.phone}`, icon: Users });
  }
  if (lead.address || lead.platform_payload?.googleMaps?.placeId) {
    const query = encodeURIComponent(`${lead.name || ""} ${lead.address || ""}`.trim());
    const placeId = lead.platform_payload?.googleMaps?.placeId;
    links.push({
      id: "maps",
      label: "Maps",
      url: `https://www.google.com/maps/search/?api=1&query=${query}${placeId ? `&query_place_id=${placeId}` : ""}`,
      icon: MapPin
    });
  }
  return links.filter((link) => link.url);
}

function LeadLinkButtons({ lead, compact = false, limit = 6 }) {
  const links = leadLinks(lead).slice(0, limit);
  if (!links.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <a
            key={link.id}
            href={link.url}
            target={link.url.startsWith("http") ? "_blank" : undefined}
            rel={link.url.startsWith("http") ? "noreferrer" : undefined}
            onClick={(event) => event.stopPropagation()}
            className={clsx(
              "inline-flex items-center justify-center rounded-md border border-white/10 bg-white/10 font-black text-white transition hover:border-[#00f5d4]/60 hover:bg-[#00f5d4] hover:text-black",
              compact ? "h-9 w-9" : "h-9 gap-2 px-3 text-xs"
            )}
            title={`Open ${link.label}`}
            aria-label={`Open ${link.label}`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {compact ? <span className="sr-only">{link.label}</span> : <span>{link.label}</span>}
          </a>
        );
      })}
    </div>
  );
}

function LeadAvatar({ lead, className = "h-12 w-12", textClassName = "text-base" }) {
  const [failed, setFailed] = useState(false);
  const avatarUrl = leadAvatarUrl(lead);

  return (
    <div className={clsx("relative shrink-0 overflow-hidden rounded-lg border border-white/15 bg-white/10", className)}>
      {avatarUrl && !failed ? (
        <img
          src={avatarUrl}
          alt=""
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className={clsx("grid h-full w-full place-items-center font-black text-white", textClassName)}>{leadInitials(lead)}</div>
      )}
    </div>
  );
}

function platformName(platform) {
  return platform === "x" ? "X" : platform.charAt(0).toUpperCase() + platform.slice(1);
}

function scoreClass(score) {
  if (score >= 8) return "from-[#00f5d4] to-[#16ff7a] text-black";
  if (score >= 6) return "from-[#ff4d6d] to-[#ffb703] text-black";
  return "from-white/25 to-white/10 text-white";
}

function stageFromStatus(statuses) {
  return inferPipelineStage(statuses || []);
}

function getStatuses(lead) {
  return lead.outreach_statuses?.length ? lead.outreach_statuses : [];
}

function upsertStatus(lead, platform, status, extra = {}) {
  const current = getStatuses(lead);
  const existing = current.find((item) => item.platform === platform);
  const next = existing
    ? current.map((item) => (item.platform === platform ? { ...item, status, ...extra } : item))
    : [...current, { platform, status, ...extra }];

  return {
    ...lead,
    outreach_statuses: next,
    pipeline_stage: stageFromStatus(next)
  };
}

function authHeaders(session) {
  return session?.access_token ? { authorization: `Bearer ${session.access_token}` } : {};
}

function leadPlatforms(lead) {
  return PLATFORMS.filter((platform) => {
    if (platform === "instagram") return lead.instagram_handle;
    if (platform === "youtube") return lead.youtube_url;
    if (platform === "x") return lead.x_handle;
    if (platform === "email") return lead.email;
    if (platform === "phone") return lead.phone;
    if (platform === "website") return lead.website;
    return false;
  });
}

function primaryPlatform(lead) {
  return lead.instagram_handle ? "instagram" : lead.email ? "email" : lead.x_handle ? "x" : lead.youtube_url ? "youtube" : "instagram";
}

function leadInitials(lead) {
  return (lead.name || "Lead")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function platformIcon(platform) {
  if (platform === "instagram") return Instagram;
  if (platform === "youtube") return Youtube;
  if (platform === "email") return Mail;
  if (platform === "x") return AtSign;
  if (platform === "phone") return Users;
  return MapPin;
}

function visibleHandle(lead) {
  if (lead.instagram_handle) return `@${lead.instagram_handle}`;
  if (lead.x_handle) return `@${lead.x_handle}`;
  if (lead.youtube_url) return "YouTube channel";
  if (lead.email) return lead.email;
  return lead.website || "new lead";
}

function StatusSelect({ lead, platform, onChange, dark = false }) {
  const status = getStatuses(lead).find((item) => item.platform === platform)?.status || "Not Contacted";
  return (
    <select
      value={status}
      onChange={(event) => onChange(lead, platform, event.target.value)}
      className={clsx(
        "h-9 rounded-md border px-2 text-xs font-bold",
        dark ? "border-white/15 bg-black/40 text-white" : "border-black/10 bg-white text-black"
      )}
      aria-label={`${platformName(platform)} status`}
    >
      {statusOptions.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  );
}

function AuthStrip({ supabase, session, email, password, setEmail, setPassword, onSignIn, onSignUp, onSignOut, message }) {
  if (!supabase) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-xs text-white/70">
        Supabase is not connected. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to save leads.
      </div>
    );
  }

  if (session) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2">
        <span className="truncate text-xs font-bold text-white/75">{session.user.email}</span>
        <button
          type="button"
          onClick={onSignOut}
          className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.06] p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-white">
        <UserPlus className="h-4 w-4 text-[#00f5d4]" aria-hidden="true" />
        Sign in
      </div>
      <div className="grid gap-2">
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          className="h-10 rounded-md border border-white/10 bg-black/40 px-3 text-sm text-white placeholder:text-white/35"
        />
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          type="password"
          className="h-10 rounded-md border border-white/10 bg-black/40 px-3 text-sm text-white placeholder:text-white/35"
        />
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={onSignIn} className="h-10 rounded-md bg-white text-sm font-black text-black">
            In
          </button>
          <button type="button" onClick={onSignUp} className="h-10 rounded-md bg-[#00f5d4] text-sm font-black text-black">
            Join
          </button>
        </div>
      </div>
      {message ? <p className="mt-2 text-xs text-white/55">{message}</p> : null}
    </div>
  );
}

function MiniMetric({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.06] p-3">
      <div className="flex items-center justify-between gap-2 text-white/55">
        <span className="text-[11px] font-black uppercase tracking-wide">{label}</span>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="mt-2 text-xl font-black text-white">{value}</div>
    </div>
  );
}

function LeadReel({
  lead,
  index,
  total,
  liked,
  busy,
  onLike,
  onPass,
  onNext,
  onPrevious,
  onScore,
  onMessage,
  onStatus,
  onStage,
  onDealValue
}) {
  const score = Number(lead.ai_score || 0);
  const platforms = leadPlatforms(lead);
  const platform = primaryPlatform(lead);
  const PlatformIcon = platformIcon(platform);
  const scorePercent = Math.max(0, Math.min(100, score * 10));
  const presence = getPlatformPresence(lead);

  return (
    <section className="relative min-h-[650px] overflow-hidden rounded-lg border border-white/10 bg-[#111] text-white shadow-[0_24px_90px_rgba(0,0,0,0.45)]">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(145deg, rgba(0,245,212,0.2), transparent 28%), linear-gradient(35deg, rgba(255,45,85,0.34), transparent 38%), linear-gradient(180deg, #202020 0%, #090909 72%)"
        }}
      />
      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-4">
        <div className="flex items-center gap-2 rounded-full bg-black/35 px-3 py-1 text-xs font-black backdrop-blur">
          <Zap className="h-3.5 w-3.5 text-[#00f5d4]" aria-hidden="true" />
          Opportunity {index + 1}/{total}
        </div>
        <div className="rounded-full bg-black/35 px-3 py-1 text-xs font-black backdrop-blur">{lead.pipeline_stage}</div>
      </div>

      <div className="relative flex min-h-[650px] flex-col justify-end p-4 pt-16 sm:p-6">
        <div className="absolute right-4 top-24 z-10 flex flex-col items-center gap-3 sm:right-5">
          <button
            type="button"
            onClick={() => onLike(lead.id)}
            className={clsx(
              "grid h-12 w-12 place-items-center rounded-full border border-white/15 text-white shadow-lg backdrop-blur transition hover:scale-105",
              liked ? "bg-[#ff2d55]" : "bg-black/45"
            )}
            title="Save lead"
          >
            <Heart className={clsx("h-5 w-5", liked && "fill-current")} aria-hidden="true" />
          </button>
          <span className="text-[11px] font-black text-white">{liked ? "Saved" : "Save"}</span>

          <button
            type="button"
            onClick={() => onMessage(lead, platform)}
            className="grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-black/45 text-white shadow-lg backdrop-blur transition hover:scale-105"
            title="Generate DM"
          >
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
          </button>
          <span className="text-[11px] font-black text-white">DM</span>

          <button
            type="button"
            onClick={() => onScore(lead)}
            disabled={busy === `score-${lead.id}`}
            className="grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-black/45 text-white shadow-lg backdrop-blur transition hover:scale-105 disabled:opacity-60"
            title="AI score"
          >
            <Sparkles className={clsx("h-5 w-5", busy === `score-${lead.id}` && "animate-spin")} aria-hidden="true" />
          </button>
          <span className="text-[11px] font-black text-white">Score</span>

          <button
            type="button"
            onClick={() => onPass(lead)}
            className="grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-black/45 text-white shadow-lg backdrop-blur transition hover:scale-105"
            title="Pass"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <span className="text-[11px] font-black text-white">Pass</span>
        </div>

        <div className="mb-8 max-w-[72%] sm:max-w-[78%]">
          <LeadAvatar lead={lead} className="mb-4 h-20 w-20 shadow-2xl backdrop-blur" textClassName="text-2xl" />
          <div className="flex items-center gap-2">
            <PlatformIcon className="h-5 w-5 text-[#00f5d4]" aria-hidden="true" />
            <span className="text-sm font-black text-white/80">{visibleHandle(lead)}</span>
          </div>
          <h1 className="mt-2 text-4xl font-black leading-none tracking-normal text-white sm:text-5xl">{lead.name}</h1>
          <p className="mt-3 text-sm font-bold uppercase tracking-wide text-[#00f5d4]">{lead.niche || lead.source || "new opportunity"}</p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/75">{lead.score_reason || lead.notes || "Tap Score to qualify this lead."}</p>
          <div className="mt-4">
            <LeadLinkButtons lead={lead} />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_180px]">
          <div className="rounded-lg border border-white/10 bg-black/45 p-3 backdrop-blur">
            <div className="flex flex-wrap gap-2">
              {[
                ["YouTube", presence.youtube],
                ["Instagram", presence.instagram],
                ["Maps", presence.maps]
              ].map(([label, isPresent]) => (
                <span
                  key={label}
                  className={clsx(
                    "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black",
                    isPresent ? "bg-[#00f5d4] text-black" : "bg-white/10 text-white/45"
                  )}
                >
                  {isPresent ? <Check className="h-3 w-3" aria-hidden="true" /> : <X className="h-3 w-3" aria-hidden="true" />}
                  {label}
                </span>
              ))}
              {Object.entries(lead.follower_counts || {}).map(([itemPlatform, value]) => (
                <span key={itemPlatform} className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white">
                  {platformName(itemPlatform)} {formatCount(value)}
                </span>
              ))}
              {platforms.map((itemPlatform) => (
                <span key={itemPlatform} className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/80">
                  {platformName(itemPlatform)}
                </span>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {PIPELINE_STAGES.map((stage) => (
                <button
                  key={stage}
                  type="button"
                  onClick={() => onStage(lead, stage)}
                  className={clsx(
                    "h-9 rounded-md px-2 text-xs font-black transition",
                    lead.pipeline_stage === stage ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"
                  )}
                >
                  {stage}
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {platforms.slice(0, 4).map((itemPlatform) => (
                <div key={itemPlatform} className="flex items-center justify-between gap-2 rounded-md bg-white/10 p-2">
                  <span className="text-xs font-black text-white/80">{platformName(itemPlatform)}</span>
                  <StatusSelect lead={lead} platform={itemPlatform} onChange={onStatus} dark />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/45 p-3 backdrop-blur">
            <div className={clsx("rounded-lg bg-gradient-to-br p-3", scoreClass(score))}>
              <div className="text-[11px] font-black uppercase tracking-wide opacity-75">Client Fit</div>
              <div className="mt-1 text-4xl font-black">{score ? score.toFixed(1) : "NA"}</div>
              <div className="mt-3 h-2 rounded-full bg-black/20">
                <div className="h-2 rounded-full bg-black" style={{ width: `${scorePercent}%` }} />
              </div>
            </div>
            <label className="mt-3 block text-[11px] font-black uppercase tracking-wide text-white/45">Deal value</label>
            <div className="mt-2 flex items-center gap-2 rounded-md border border-white/10 bg-black/35 px-3">
              <DollarSign className="h-4 w-4 text-white/50" aria-hidden="true" />
              <input
                type="number"
                min="0"
                value={lead.deal_value || 0}
                onChange={(event) => onDealValue(lead, event.target.value)}
                className="h-10 w-full bg-transparent text-sm font-black text-white outline-none"
              />
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 right-4 hidden flex-col gap-2 sm:flex">
          <button
            type="button"
            onClick={onPrevious}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/45 text-white backdrop-blur"
            title="Previous lead"
          >
            <ChevronUp className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onNext}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/45 text-white backdrop-blur"
            title="Next lead"
          >
            <ChevronDown className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}

function LeadStrip({ leads, selectedLeadId, likedLeadIds, onSelect }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 lg:block lg:max-h-[560px] lg:space-y-3 lg:overflow-y-auto lg:overflow-x-hidden lg:pr-1">
      {leads.map((lead) => (
        <article
          key={lead.id}
          className={clsx(
            "min-w-[220px] rounded-lg border p-3 text-left transition hover:-translate-y-0.5 lg:min-w-0 lg:w-full",
            selectedLeadId === lead.id ? "border-[#00f5d4] bg-[#00f5d4]/10" : "border-white/10 bg-white/[0.06]"
          )}
        >
          <button type="button" onClick={() => onSelect(lead.id)} className="w-full text-left">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <LeadAvatar lead={lead} className="h-10 w-10 rounded-md" textClassName="text-sm" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-black text-white">{lead.name}</div>
                  <div className="mt-1 truncate text-xs text-white/45">{visibleHandle(lead)}</div>
                </div>
              </div>
              {likedLeadIds.includes(lead.id) ? <Heart className="h-4 w-4 shrink-0 fill-[#ff2d55] text-[#ff2d55]" /> : null}
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] font-black text-white/75">{lead.pipeline_stage}</span>
              <span className="text-xs font-black text-[#00f5d4]">{lead.ai_score ? Number(lead.ai_score).toFixed(1) : "NA"}</span>
            </div>
          </button>
          <div className="mt-3">
            <LeadLinkButtons lead={lead} compact limit={4} />
          </div>
        </article>
      ))}
    </div>
  );
}

function FinderPanel({
  source,
  setSource,
  keyword,
  setKeyword,
  city,
  setCity,
  category,
  setCategory,
  manualText,
  setManualText,
  saveResults,
  setSaveResults,
  searchResults,
  busy,
  onSubmit,
  onAdd
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
      <form onSubmit={onSubmit} className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-white">Automated lead finder</h2>
            <p className="mt-1 text-sm text-white/50">Search YouTube, Instagram, and Maps in one run.</p>
          </div>
          <label className="inline-flex items-center gap-2 text-xs font-black text-white/65">
            <input
              type="checkbox"
              checked={saveResults}
              onChange={(event) => setSaveResults(event.target.checked)}
              className="h-4 w-4 accent-[#00f5d4]"
            />
            Save
          </label>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {sourceOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSource(option.id)}
                className={clsx(
                  "inline-flex h-12 items-center justify-center gap-2 rounded-md border px-3 text-sm font-black transition",
                  source === option.id ? "border-[#00f5d4] bg-[#00f5d4] text-black" : "border-white/10 bg-black/25 text-white"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="mt-5 space-y-3">
          {source === "auto" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Niche or client type"
                className="h-12 rounded-md border border-white/10 bg-black/40 px-3 text-sm text-white placeholder:text-white/35"
              />
              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="City for Maps"
                className="h-12 rounded-md border border-white/10 bg-black/40 px-3 text-sm text-white placeholder:text-white/35"
              />
            </div>
          ) : source === "maps" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Business type"
                className="h-12 rounded-md border border-white/10 bg-black/40 px-3 text-sm text-white placeholder:text-white/35"
              />
              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="City"
                className="h-12 rounded-md border border-white/10 bg-black/40 px-3 text-sm text-white placeholder:text-white/35"
              />
            </div>
          ) : source === "manual" ? (
            <textarea
              value={manualText}
              onChange={(event) => setManualText(event.target.value)}
              placeholder="Paste handles, one per line"
              rows={7}
              className="w-full resize-none rounded-md border border-white/10 bg-black/40 px-3 py-3 text-sm text-white placeholder:text-white/35"
            />
          ) : (
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Niche keyword"
              className="h-12 w-full rounded-md border border-white/10 bg-black/40 px-3 text-sm text-white placeholder:text-white/35"
            />
          )}

          <button
            type="submit"
            disabled={busy === "search"}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#ff2d55] px-4 text-sm font-black text-white transition hover:bg-[#ff4167] disabled:opacity-60"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            {busy === "search" ? "Searching..." : source === "auto" ? "Run automated search" : "Find the next batch"}
          </button>
        </div>
      </form>

      <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-black text-white">Fresh pulls</h2>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/70">{searchResults.length} found</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {searchResults.length ? (
            searchResults.map((lead) => (
              <article
                key={`${lead.source}-${lead.name}-${lead.instagram_handle || lead.youtube_url || lead.website}`}
                className="rounded-lg border border-white/10 bg-black/25 p-4"
              >
                <LeadAvatar lead={lead} className="h-14 w-14" textClassName="text-lg" />
                <h3 className="mt-4 line-clamp-2 text-lg font-black text-white">{lead.name}</h3>
                <p className="mt-1 truncate text-sm text-white/50">{lead.niche || lead.source}</p>
                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onAdd(lead)}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-white text-sm font-black text-black"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add
                  </button>
                  <LeadLinkButtons lead={lead} compact limit={3} />
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-white/15 p-8 text-center text-sm text-white/45 md:col-span-2 xl:col-span-3">
              No pulls yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MessagePanel({ messagePanel, onCopy, onMarkSent, onClose }) {
  if (!messagePanel) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.06] p-5">
        <h2 className="text-2xl font-black text-white">Message Studio</h2>
        <p className="mt-2 text-sm text-white/55">Generate a message from any lead card.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#00f5d4]/30 bg-[#00f5d4]/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <LeadAvatar lead={messagePanel.lead} className="h-12 w-12" textClassName="text-sm" />
          <div className="min-w-0">
            <div className="text-xs font-black uppercase tracking-wide text-[#00f5d4]">{messagePanel.provider || "AI"} wrote this</div>
            <h2 className="mt-1 truncate text-2xl font-black text-white">{messagePanel.lead.name}</h2>
            <p className="mt-1 text-sm text-white/55">{platformName(messagePanel.platform)} outreach</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-4">
        <LeadLinkButtons lead={messagePanel.lead} compact />
      </div>
      {messagePanel.subject ? <div className="mt-4 rounded-md bg-black/30 p-3 text-sm font-black text-white">Subject: {messagePanel.subject}</div> : null}
      <pre className="mt-3 max-h-[360px] overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-black/35 p-4 text-sm leading-6 text-white">
        {messagePanel.message}
      </pre>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onCopy(`${messagePanel.subject ? `${messagePanel.subject}\n\n` : ""}${messagePanel.message}`)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-white text-sm font-black text-black"
        >
          <Copy className="h-4 w-4" aria-hidden="true" />
          Copy
        </button>
        <button
          type="button"
          onClick={() => onMarkSent(messagePanel.lead, messagePanel.platform, messagePanel.message)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#ff2d55] text-sm font-black text-white"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          Sent
        </button>
      </div>
    </div>
  );
}

function PipelineView({ leads, filteredLeads, onDragStart, onDropStage, onSelect }) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-white">Close board</h2>
          <p className="mt-1 text-sm text-white/50">{leads.length} total leads</p>
        </div>
        <Flame className="h-6 w-6 text-[#ff2d55]" aria-hidden="true" />
      </div>
      <div className="grid gap-3 xl:grid-cols-5">
        {PIPELINE_STAGES.map((stage) => {
          const stageLeads = filteredLeads.filter((lead) => lead.pipeline_stage === stage);
          return (
            <div
              key={stage}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => onDropStage(event, stage)}
              className="min-h-[280px] rounded-lg border border-white/10 bg-black/25 p-3"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-sm font-black text-white">{stage}</h3>
                <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-black text-white/60">{stageLeads.length}</span>
              </div>
              <div className="space-y-3">
                {stageLeads.map((lead) => (
                  <article
                    key={lead.id}
                    draggable
                    onDragStart={(event) => onDragStart(event, lead)}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.06] p-3 text-left transition hover:border-[#00f5d4]/50"
                  >
                    <button type="button" onClick={() => onSelect(lead.id)} className="w-full text-left">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <LeadAvatar lead={lead} className="h-9 w-9 rounded-md" textClassName="text-xs" />
                          <span className="truncate text-sm font-black text-white">{lead.name}</span>
                        </div>
                        <span className="text-xs font-black text-[#00f5d4]">{lead.ai_score ? Number(lead.ai_score).toFixed(1) : "NA"}</span>
                      </div>
                      <div className="mt-1 truncate text-xs text-white/45">{lead.niche || visibleHandle(lead)}</div>
                    </button>
                    <div className="mt-3">
                      <LeadLinkButtons lead={lead} compact limit={3} />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function ShortsAgencyOS() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [leads, setLeads] = useState(initialLeads);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [likedLeadIds, setLikedLeadIds] = useState([]);
  const [view, setView] = useState("feed");
  const [source, setSource] = useState("auto");
  const [keyword, setKeyword] = useState("business podcast");
  const [city, setCity] = useState("Austin");
  const [category, setCategory] = useState("fitness studio");
  const [manualText, setManualText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [saveResults, setSaveResults] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ niche: "", platform: "all", minScore: 0 });
  const [messagePanel, setMessagePanel] = useState(null);

  const liveLeads = useMemo(() => withoutPlaceholderLeads(leads), [leads]);
  const selectedLead = liveLeads.find((lead) => lead.id === selectedLeadId) || liveLeads[0];

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session || null);
      if (data.session) loadLeads(data.session);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) loadLeads(nextSession);
    });

    return () => data.subscription.unsubscribe();
  }, [supabase]);

  async function request(path, options = {}) {
    const response = await fetch(path, {
      ...options,
      headers: {
        "content-type": "application/json",
        ...authHeaders(session),
        ...(options.headers || {})
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed.");
    return data;
  }

  async function loadLeads(activeSession = session) {
    if (!activeSession) return;
    try {
      setBusy("load");
      const response = await fetch("/api/leads", {
        headers: authHeaders(activeSession)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load leads.");
      const nextLeads = withoutPlaceholderLeads(data.leads || []);
      setLeads(nextLeads);
      setSelectedLeadId(nextLeads[0]?.id || null);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setBusy("");
    }
  }

  async function signIn() {
    if (!supabase) return;
    setAuthMessage("");
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setAuthMessage(signInError ? signInError.message : "Signed in.");
  }

  async function signUp() {
    if (!supabase) return;
    setAuthMessage("");
    const { error: signUpError } = await supabase.auth.signUp({ email, password });
    setAuthMessage(signUpError ? signUpError.message : "Account created. Check your email if confirmations are enabled.");
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setLeads(initialLeads);
    setSelectedLeadId(null);
  }

  function mergeLead(nextLead) {
    setLeads((current) => {
      const exists = current.some((lead) => lead.id === nextLead.id);
      return exists ? current.map((lead) => (lead.id === nextLead.id ? { ...lead, ...nextLead } : lead)) : [nextLead, ...current];
    });
    setSelectedLeadId(nextLead.id);
  }

  async function addLead(lead) {
    try {
      if (session) {
        const data = await request("/api/leads", {
          method: "POST",
          body: JSON.stringify(lead)
        });
        mergeLead(data.lead);
      } else {
        mergeLead({
          ...lead,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          pipeline_stage: "Prospect",
          outreach_statuses: []
        });
      }
      setView("feed");
    } catch (addError) {
      setError(addError.message);
    }
  }

  async function runLeadSearch(event) {
    event.preventDefault();
    setError("");
    setMessagePanel(null);
    setBusy("search");

    try {
      const endpoint =
        source === "auto"
          ? "/api/leads/autopilot"
          : source === "youtube"
          ? "/api/leads/search/youtube"
          : source === "instagram"
            ? "/api/leads/search/instagram"
            : source === "maps"
              ? "/api/leads/search/maps"
              : "/api/leads/import";

      const body =
        source === "auto"
          ? { keyword, category: keyword, city, save: saveResults, includeFiltered: true }
          : source === "maps"
          ? { category, city, save: saveResults }
          : source === "manual"
            ? { text: manualText, niche: keyword, save: saveResults }
            : { keyword, save: saveResults };

      const data = await request(endpoint, {
        method: "POST",
        body: JSON.stringify(body)
      });

      const saved = data.saved || [];
      if (saved.length) {
        saved.forEach(mergeLead);
        setSearchResults(saved);
      } else {
        setSearchResults(data.leads || []);
      }
    } catch (searchError) {
      setError(searchError.message);
    } finally {
      setBusy("");
    }
  }

  async function scoreLead(lead) {
    setBusy(`score-${lead.id}`);
    setError("");
    try {
      const data = await request("/api/ai/score", {
        method: "POST",
        body: JSON.stringify({ lead })
      });
      mergeLead(data.lead);
    } catch (scoreError) {
      setError(scoreError.message);
    } finally {
      setBusy("");
    }
  }

  async function generateMessage(lead, platform, followUp = false) {
    setBusy(`message-${lead.id}-${platform}`);
    setError("");
    try {
      const data = await request("/api/ai/message", {
        method: "POST",
        body: JSON.stringify({ lead, platform, followUp })
      });
      setMessagePanel({ lead, platform, ...data, followUp });
      setView("dms");
    } catch (messageError) {
      setError(messageError.message);
    } finally {
      setBusy("");
    }
  }

  async function copyMessage(text) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setAuthMessage("Copied.");
    } catch {
      setAuthMessage("Copy failed. Select the message text manually.");
    }
  }

  async function changeStatus(lead, platform, status, extra = {}) {
    const nextLead = upsertStatus(lead, platform, status, extra);
    mergeLead(nextLead);

    if (!session) return;

    try {
      await request(`/api/leads/${lead.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          outreach: { platform, status, extra },
          lead: { pipeline_stage: nextLead.pipeline_stage }
        })
      });
    } catch (statusError) {
      setError(statusError.message);
    }
  }

  async function moveStage(lead, stage) {
    mergeLead({ ...lead, pipeline_stage: stage });
    if (!session) return;

    try {
      await request(`/api/leads/${lead.id}`, {
        method: "PATCH",
        body: JSON.stringify({ lead: { pipeline_stage: stage } })
      });
    } catch (moveError) {
      setError(moveError.message);
    }
  }

  async function updateDealValue(lead, value) {
    const dealValue = Number(value || 0);
    mergeLead({ ...lead, deal_value: dealValue });
    if (!session) return;

    try {
      await request(`/api/leads/${lead.id}`, {
        method: "PATCH",
        body: JSON.stringify({ lead: { deal_value: dealValue } })
      });
    } catch (dealError) {
      setError(dealError.message);
    }
  }

  async function runDueFollowups() {
    setBusy("followups");
    setError("");
    try {
      const data = await request("/api/followups/due", {
        method: "POST",
        body: JSON.stringify({})
      });
      if (data.generated?.[0]) {
        setMessagePanel({
          lead: data.generated[0].lead,
          platform: data.generated[0].platform,
          message: data.generated[0].message,
          provider: data.generated[0].provider,
          followUp: true
        });
      }
      setAuthMessage(`${data.generated?.length || 0} due follow-ups generated.`);
      if (session) loadLeads();
    } catch (followupError) {
      setError(followupError.message);
    } finally {
      setBusy("");
    }
  }

  function onDragStart(event, lead) {
    event.dataTransfer.setData("text/plain", lead.id);
  }

  function onDropStage(event, stage) {
    event.preventDefault();
    const leadId = event.dataTransfer.getData("text/plain");
    const lead = liveLeads.find((item) => item.id === leadId);
    if (lead) moveStage(lead, stage);
  }

  function toggleLike(leadId) {
    setLikedLeadIds((current) => (current.includes(leadId) ? current.filter((id) => id !== leadId) : [...current, leadId]));
  }

  function selectByOffset(offset) {
    if (!filteredLeads.length) return;
    const currentIndex = Math.max(0, filteredLeads.findIndex((lead) => lead.id === selectedLeadId));
    const nextIndex = (currentIndex + offset + filteredLeads.length) % filteredLeads.length;
    setSelectedLeadId(filteredLeads[nextIndex].id);
  }

  function passLead(lead) {
    moveStage(lead, "Prospect");
    selectByOffset(1);
  }

  const filteredLeads = liveLeads.filter((lead) => {
    const matchesNiche = !filters.niche || (lead.niche || "").toLowerCase().includes(filters.niche.toLowerCase());
    const matchesPlatform =
      filters.platform === "all" ||
      (filters.platform === "instagram" && lead.instagram_handle) ||
      (filters.platform === "youtube" && lead.youtube_url) ||
      (filters.platform === "x" && lead.x_handle) ||
      (filters.platform === "email" && lead.email);
    const matchesScore = Number(lead.ai_score || 0) >= Number(filters.minScore || 0);
    return matchesNiche && matchesPlatform && matchesScore;
  });

  const activeLead = filteredLeads.find((lead) => lead.id === selectedLeadId) || filteredLeads[0] || selectedLead;
  const activeIndex = Math.max(0, filteredLeads.findIndex((lead) => lead.id === activeLead?.id));

  useEffect(() => {
    function onKeyDown(event) {
      const tag = event.target?.tagName?.toLowerCase();
      if (["input", "textarea", "select"].includes(tag)) return;

      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault();
        selectByOffset(1);
      }

      if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        selectByOffset(-1);
      }

      if (event.key.toLowerCase() === "l" && activeLead) {
        toggleLike(activeLead.id);
      }

      if (event.key.toLowerCase() === "m" && activeLead) {
        generateMessage(activeLead, primaryPlatform(activeLead));
      }

      if (event.key.toLowerCase() === "s" && activeLead) {
        scoreLead(activeLead);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeLead, selectedLeadId, filteredLeads.length]);

  const statuses = liveLeads.flatMap((lead) => getStatuses(lead));
  const sent = statuses.filter((item) => ["Sent", "Replied", "Booked", "Closed"].includes(item.status)).length;
  const replies = statuses.filter((item) => ["Replied", "Booked", "Closed"].includes(item.status)).length;
  const booked = statuses.filter((item) => ["Booked", "Closed"].includes(item.status)).length;
  const month = new Date().getMonth();
  const monthlyRevenue = liveLeads
    .filter((lead) => new Date(lead.created_at || Date.now()).getMonth() === month)
    .reduce((sum, lead) => sum + Number(lead.deal_value || 0), 0);
  const dueFollowups = liveLeads.filter((lead) =>
    getStatuses(lead).some(
      (status) =>
        status.status === "Sent" &&
        status.next_follow_up_at &&
        new Date(status.next_follow_up_at).getTime() <= Date.now()
    )
  );
  const hotLeads = [...liveLeads].sort((a, b) => Number(b.ai_score || 0) - Number(a.ai_score || 0)).slice(0, 4);

  return (
    <main className="min-h-screen bg-[#070707] px-4 pb-28 pt-4 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1480px] space-y-5">
        <header className="sticky top-0 z-30 -mx-4 border-b border-white/10 bg-[#070707]/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4">
            <button type="button" onClick={() => setView("feed")} className="flex min-w-0 items-center gap-3 text-left">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-[#ff2d55] text-white shadow-[0_0_28px_rgba(255,45,85,0.4)]">
                <Zap className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-lg font-black leading-5">Shorts Agency OS</div>
                <div className="truncate text-xs font-bold text-white/45">fast outreach workspace</div>
              </div>
            </button>

            <nav className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] p-1 md:flex">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setView(item.id)}
                    className={clsx(
                      "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-black transition",
                      view === item.id ? "bg-white text-black" : "text-white/65 hover:text-white"
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => (session ? loadLeads() : setAuthMessage("Sign in to sync saved leads."))}
                className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-white"
                title={session ? "Refresh" : "Sign in to sync"}
              >
                <RefreshCw className={clsx("h-4 w-4", busy === "load" && "animate-spin")} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setView("hunt")}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-[#00f5d4] px-4 text-sm font-black text-black"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Find
              </button>
            </div>
          </div>
        </header>

        {error ? (
          <div className="flex items-start gap-3 rounded-lg border border-[#ff2d55]/40 bg-[#ff2d55]/10 p-4 text-sm text-white">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#ff2d55]" aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MiniMetric icon={Flame} label="Leads" value={liveLeads.length} />
          <MiniMetric icon={Send} label="Messages Sent" value={sent} />
          <MiniMetric icon={MessageCircle} label="Replies" value={replies} />
          <MiniMetric icon={DollarSign} label="Revenue" value={`$${monthlyRevenue.toLocaleString()}`} />
        </section>

        {view === "feed" ? (
          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={filters.niche}
                  onChange={(event) => setFilters((current) => ({ ...current, niche: event.target.value }))}
                  placeholder="Search niche"
                  className="h-11 min-w-[220px] flex-1 rounded-full border border-white/10 bg-white/[0.06] px-4 text-sm font-bold text-white placeholder:text-white/35"
                />
                <select
                  value={filters.platform}
                  onChange={(event) => setFilters((current) => ({ ...current, platform: event.target.value }))}
                  className="h-11 rounded-full border border-white/10 bg-white/[0.06] px-4 text-sm font-black text-white"
                >
                  <option value="all">All</option>
                  <option value="instagram">IG</option>
                  <option value="youtube">YT</option>
                  <option value="x">X</option>
                  <option value="email">Email</option>
                </select>
                <select
                  value={filters.minScore}
                  onChange={(event) => setFilters((current) => ({ ...current, minScore: Number(event.target.value) }))}
                  className="h-11 rounded-full border border-white/10 bg-white/[0.06] px-4 text-sm font-black text-white"
                >
                  <option value={0}>Any score</option>
                  <option value={6}>6+</option>
                  <option value={8}>8+</option>
                  <option value={9}>9+</option>
                </select>
              </div>

              {activeLead ? (
                <LeadReel
                  lead={activeLead}
                  index={activeIndex}
                  total={filteredLeads.length}
                  liked={likedLeadIds.includes(activeLead.id)}
                  busy={busy}
                  onLike={toggleLike}
                  onPass={passLead}
                  onNext={() => selectByOffset(1)}
                  onPrevious={() => selectByOffset(-1)}
                  onScore={scoreLead}
                  onMessage={generateMessage}
                  onStatus={changeStatus}
                  onStage={moveStage}
                  onDealValue={updateDealValue}
                />
              ) : (
                <div className="rounded-lg border border-dashed border-white/15 p-8 text-center">
                  <div className="text-xl font-black text-white">{liveLeads.length ? "No leads match your filters" : "No leads yet"}</div>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/50">
                    {liveLeads.length
                      ? "Clear the filters or lower the score threshold."
                      : "Run the automated finder to pull real prospects from YouTube, Instagram, and Maps."}
                  </p>
                  {!liveLeads.length ? (
                    <button
                      type="button"
                      onClick={() => setView("hunt")}
                      className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#00f5d4] px-5 text-sm font-black text-black"
                    >
                      <Search className="h-4 w-4" aria-hidden="true" />
                      Find leads
                    </button>
                  ) : null}
                </div>
              )}
            </div>

            <aside className="space-y-4">
              <AuthStrip
                supabase={supabase}
                session={session}
                email={email}
                password={password}
                setEmail={setEmail}
                setPassword={setPassword}
                onSignIn={signIn}
                onSignUp={signUp}
                onSignOut={signOut}
                message={authMessage}
              />

              <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-sm font-black uppercase tracking-wide text-white/80">Queue</h2>
                  <span className="text-xs font-black text-white/45">{filteredLeads.length} cards</span>
                </div>
                <LeadStrip leads={filteredLeads} selectedLeadId={activeLead?.id} likedLeadIds={likedLeadIds} onSelect={setSelectedLeadId} />
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-sm font-black uppercase tracking-wide text-white/80">Follow-ups</h2>
                  <span className="rounded-full bg-[#ff2d55] px-2 py-1 text-xs font-black text-white">{dueFollowups.length}</span>
                </div>
                <button
                  type="button"
                  onClick={runDueFollowups}
                  disabled={!session || busy === "followups"}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-white text-sm font-black text-black disabled:opacity-45"
                >
                  <CalendarClock className="h-4 w-4" aria-hidden="true" />
                  Generate
                </button>
              </div>
            </aside>
          </section>
        ) : null}

        {view === "hunt" ? (
          <FinderPanel
            source={source}
            setSource={setSource}
            keyword={keyword}
            setKeyword={setKeyword}
            city={city}
            setCity={setCity}
            category={category}
            setCategory={setCategory}
            manualText={manualText}
            setManualText={setManualText}
            saveResults={saveResults}
            setSaveResults={setSaveResults}
            searchResults={searchResults}
            busy={busy}
            onSubmit={runLeadSearch}
            onAdd={addLead}
          />
        ) : null}

        {view === "dms" ? (
          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <MessagePanel
              messagePanel={messagePanel}
              onCopy={copyMessage}
              onClose={() => setMessagePanel(null)}
              onMarkSent={(lead, platform, message) => changeStatus(lead, platform, "Sent", { last_message: message })}
            />
            <div className="space-y-3">
              {liveLeads.map((lead) => {
                const platform = primaryPlatform(lead);
                return (
                  <article
                    key={lead.id}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.06] p-3 text-left"
                  >
                    <button type="button" onClick={() => generateMessage(lead, platform)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <LeadAvatar lead={lead} className="h-10 w-10 rounded-md" textClassName="text-xs" />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-white">{lead.name}</div>
                        <div className="truncate text-xs text-white/45">{platformName(platform)} . {visibleHandle(lead)}</div>
                      </div>
                    </button>
                    <div className="flex shrink-0 items-center gap-2">
                      <LeadLinkButtons lead={lead} compact limit={2} />
                      <button
                        type="button"
                        onClick={() => generateMessage(lead, platform)}
                        className="grid h-9 w-9 place-items-center rounded-md bg-[#00f5d4] text-black"
                        title="Generate message"
                      >
                        <Send className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        {view === "pipeline" ? (
          <PipelineView
            leads={liveLeads}
            filteredLeads={filteredLeads}
            onDragStart={onDragStart}
            onDropStage={onDropStage}
            onSelect={(leadId) => {
              setSelectedLeadId(leadId);
              setView("feed");
            }}
          />
        ) : null}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#070707]/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                className={clsx(
                  "grid h-14 place-items-center rounded-lg text-[11px] font-black",
                  view === item.id ? "bg-white text-black" : "bg-white/[0.06] text-white/65"
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </main>
  );
}
