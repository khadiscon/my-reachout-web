"use client";

import { useEffect, useMemo, useState } from "react";
import { useIsDemo } from "@/lib/demo-context";
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
  Flame,
  Globe,
  Home,
  Instagram,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Target,
  Trash2,
  UserPlus,
  Users,
  X,
  Youtube,
  Zap
} from "lucide-react";
import clsx from "clsx";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { PIPELINE_STAGES, PLATFORMS, inferPipelineStage } from "@/lib/lead-utils";
import { getPlatformPresence } from "@/lib/platform-presence";

const SCORE_THRESHOLD = 7.0;

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

const SCORE_BREAKDOWN_LABELS = {
  contentWeakness: "Content Weakness",
  shortFormGap: "Short-Form Gap",
  moneySignal: "Money Signal",
  urgency: "Urgency",
  platformPresence: "Platform Presence"
};

const seedLeads = [
  {
    id: "demo-1",
    name: "Founders Lab Podcast",
    niche: "business podcast",
    instagram_handle: "founderslabpod",
    youtube_url: "https://youtube.com/@founderslabpod",
    x_handle: "founderslabpod",
    email: "team@founderslab.example",
    source: "demo",
    follower_counts: { youtube: 42800, instagram: 8700, x: 3900 },
    platform_payload: {
      youtube: { longVideoCount: 18, recentShortCount: 1 },
      instagram: { bio: "Founder interviews and clips", reelCount: 2 }
    },
    ai_score: 8.4,
    score_breakdown: { contentWeakness: 8, shortFormGap: 9, moneySignal: 8, urgency: 8, platformPresence: 7 },
    score_reason: "Strong long-form cadence with limited short clips and clear sponsor/business intent.",
    notes: "Hosts interview SaaS founders twice per week.",
    pipeline_stage: "Prospect",
    deal_value: 0,
    created_at: new Date().toISOString(),
    duplicate_candidates: [],
    outreach_statuses: [
      { platform: "instagram", status: "Not Contacted", follow_up_count: 0 },
      { platform: "email", status: "Not Contacted", follow_up_count: 0 }
    ]
  },
  {
    id: "demo-2",
    name: "Forge Fitness Austin",
    niche: "fitness studio",
    instagram_handle: "forgefitnessatx",
    email: "hello@forgefitness.example",
    phone: "+1 512 555 0188",
    website: "https://forgefitness.example",
    address: "Austin, TX",
    source: "demo",
    follower_counts: { instagram: 15300 },
    platform_payload: {
      instagram: { bio: "Austin strength studio", reelCount: 1 },
      mapbox: { category: "gym, health", lat: 30.26, lng: -97.74, city: "Austin" }
    },
    ai_score: 7.2,
    score_breakdown: { contentWeakness: 7, shortFormGap: 7, moneySignal: 8, urgency: 7, platformPresence: 6 },
    score_reason: "Active local brand with clear offer but sporadic reels and no consistent content system.",
    notes: "Good local business target for recurring clips.",
    pipeline_stage: "Contacted",
    deal_value: 0,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    duplicate_candidates: [],
    outreach_statuses: [
      {
        platform: "instagram",
        status: "Sent",
        follow_up_count: 1,
        last_contacted_at: new Date(Date.now() - 4 * 86400000).toISOString(),
        next_follow_up_at: new Date(Date.now() - 86400000).toISOString()
      },
      { platform: "email", status: "Not Contacted", follow_up_count: 0 }
    ]
  },
  {
    id: "demo-3",
    name: "Maya Ops Daily",
    niche: "operations consulting",
    x_handle: "mayaopsdaily",
    email: "maya@example.com",
    source: "demo",
    follower_counts: { x: 22100 },
    ai_score: 8.9,
    score_breakdown: { contentWeakness: 8, shortFormGap: 10, moneySignal: 9, urgency: 8, platformPresence: 5 },
    score_reason: "High authority written content with almost no video presence and strong consulting signal.",
    notes: "Could pitch text-to-video repurposing.",
    pipeline_stage: "Booked",
    deal_value: 2500,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    duplicate_candidates: [],
    outreach_statuses: [
      { platform: "x", status: "Booked", follow_up_count: 0 },
      { platform: "email", status: "Replied", follow_up_count: 0 }
    ]
  }
];

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatCount(value) {
  const n = Number(value || 0);
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function platformName(platform) {
  return platform === "x" ? "X" : platform.charAt(0).toUpperCase() + platform.slice(1);
}

function platformUrl(platform, lead) {
  if (platform === "youtube") return lead.youtube_url || null;
  if (platform === "instagram") return lead.instagram_handle ? `https://instagram.com/${lead.instagram_handle}` : null;
  if (platform === "x") return lead.x_handle ? `https://x.com/${lead.x_handle}` : null;
  if (platform === "email") return lead.email ? `mailto:${lead.email}` : null;
  if (platform === "website") return lead.website || null;
  return null;
}

function PlatformLinks({ lead, size = "md" }) {
  const entries = [];

  if (lead.youtube_url) entries.push({
    platform: "youtube", url: lead.youtube_url,
    icon: <Youtube className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />,
    label: lead.follower_counts?.youtube ? formatCount(lead.follower_counts.youtube) : "YouTube",
    color: "#ff2d55"
  });
  if (lead.instagram_handle) entries.push({
    platform: "instagram", url: `https://instagram.com/${lead.instagram_handle}`,
    icon: <Instagram className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />,
    label: lead.follower_counts?.instagram ? formatCount(lead.follower_counts.instagram) : `@${lead.instagram_handle}`,
    color: "#e1306c"
  });
  if (lead.x_handle) entries.push({
    platform: "x", url: `https://x.com/${lead.x_handle}`,
    icon: <AtSign className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />,
    label: lead.follower_counts?.x ? formatCount(lead.follower_counts.x) : `@${lead.x_handle}`,
    color: "#fff"
  });
  if (lead.website) entries.push({
    platform: "website", url: lead.website,
    icon: <Globe className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />,
    label: "Website",
    color: "#00f5d4"
  });
  if (lead.email) entries.push({
    platform: "email", url: `mailto:${lead.email}`,
    icon: <AtSign className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />,
    label: lead.email,
    color: "#ffb703"
  });

  if (!entries.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(({ platform, url, icon, label, color }) => (
        <a
          key={platform}
          href={url}
          target={platform === "email" ? "_self" : "_blank"}
          rel="noopener noreferrer"
          title={`Open ${platformName(platform)}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-black transition hover:border-white/20 hover:bg-white/10"
          style={{ color }}
        >
          {icon}
          {label}
        </a>
      ))}
    </div>
  );
}


function scoreColor(score) {
  if (score >= 8) return "#00f5d4";
  if (score >= SCORE_THRESHOLD) return "#ffb703";
  return "#ff2d55";
}

function scoreLabel(score) {
  if (score >= 9) return "🔥 Fire";
  if (score >= 8) return "Hot";
  if (score >= SCORE_THRESHOLD) return "Warm";
  return "Cold";
}

function stageColor(stage) {
  const colors = { Prospect: "#555", Contacted: "#ffb703", Replied: "#00b4ff", Booked: "#00f5d4", Closed: "#16ff7a" };
  return colors[stage] || "#555";
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
  return { ...lead, outreach_statuses: next, pipeline_stage: stageFromStatus(next) };
}

function authHeaders(session) {
  return session?.access_token ? { authorization: `Bearer ${session.access_token}` } : {};
}

function leadPlatforms(lead) {
  return PLATFORMS.filter((p) => {
    if (p === "instagram") return lead.instagram_handle;
    if (p === "youtube") return lead.youtube_url;
    if (p === "x") return lead.x_handle;
    if (p === "email") return lead.email;
    if (p === "phone") return lead.phone;
    if (p === "website") return lead.website;
    return false;
  });
}

function primaryPlatform(lead) {
  return lead.instagram_handle ? "instagram" : lead.email ? "email" : lead.x_handle ? "x" : lead.youtube_url ? "youtube" : "instagram";
}

function leadInitials(lead) {
  return (lead.name || "Lead").split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function LeadAvatar({ lead, size = "md" }) {
  const [imgError, setImgError] = useState(false);
  const sizeClasses = size === "lg" ? "h-16 w-16 text-xl rounded-xl" : size === "sm" ? "h-9 w-9 text-xs rounded-lg" : "h-12 w-12 text-base rounded-lg";
  if (lead.profile_image && !imgError) {
    return (
      <img
        src={lead.profile_image}
        alt={lead.name}
        onError={() => setImgError(true)}
        className={`${sizeClasses} shrink-0 object-cover`}
      />
    );
  }
  return (
    <div className={`${sizeClasses} shrink-0 grid place-items-center bg-white/10 font-black text-white`}>
      {leadInitials(lead)}
    </div>
  );
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
  if (lead.youtube_url) return "YouTube";
  if (lead.email) return lead.email;
  return lead.website || "new lead";
}

// ─── sub-components ──────────────────────────────────────────────────────────

function StatusSelect({ lead, platform, onChange, dark = false }) {
  const status = getStatuses(lead).find((item) => item.platform === platform)?.status || "Not Contacted";
  return (
    <select
      value={status}
      onChange={(e) => onChange(lead, platform, e.target.value)}
      className={clsx(
        "h-9 rounded-md border px-2 text-xs font-bold",
        dark ? "border-white/15 bg-black/40 text-white" : "border-black/10 bg-white text-black"
      )}
      aria-label={`${platformName(platform)} status`}
    >
      {statusOptions.map((o) => <option key={o}>{o}</option>)}
    </select>
  );
}

function ScoreBar({ label, value }) {
  const pct = Math.min(100, Math.max(0, Number(value || 0) * 10));
  const color = value >= 8 ? "#00f5d4" : value >= 6 ? "#ffb703" : "#ff2d55";
  return (
    <div className="grid gap-1">
      <div className="flex justify-between text-[10px] font-black">
        <span className="text-white/55">{label}</span>
        <span style={{ color }}>{Number(value || 0).toFixed(0)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10">
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function AuthStrip({ supabase, session, email, password, setEmail, setPassword, onSignIn, onSignUp, onSignOut, message }) {
  if (!supabase) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-xs text-white/60">
        Demo mode — add Supabase env vars to persist leads.
      </div>
    );
  }
  if (session) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2">
        <span className="truncate text-xs font-bold text-white/65">{session.user.email}</span>
        <button type="button" onClick={onSignOut} className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white" title="Sign out">
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.06] p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-white">
        <UserPlus className="h-4 w-4 text-[#00f5d4]" />
        Sign in to save
      </div>
      <div className="grid gap-2">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="h-10 rounded-md border border-white/10 bg-black/40 px-3 text-sm text-white placeholder:text-white/30" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="h-10 rounded-md border border-white/10 bg-black/40 px-3 text-sm text-white placeholder:text-white/30" />
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={onSignIn} className="h-10 rounded-md bg-white text-sm font-black text-black">Sign in</button>
          <button type="button" onClick={onSignUp} className="h-10 rounded-md bg-[#00f5d4] text-sm font-black text-black">Join</button>
        </div>
      </div>
      {message ? <p className="mt-2 text-xs text-white/50">{message}</p> : null}
    </div>
  );
}

function MiniMetric({ label, value, icon: Icon, accent }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-black uppercase tracking-widest text-white/40">{label}</span>
        <Icon className="h-3.5 w-3.5 text-white/25" />
      </div>
      <div className="mt-2 text-2xl font-black" style={{ color: accent || "white" }}>{value}</div>
    </div>
  );
}

function LeadReel({ lead, index, total, busy, onPass, onDelete, onNext, onPrevious, onScore, onMessage, onStatus, onStage, onDealValue, onNoteSave }) {
  const score = Number(lead.ai_score || 0);
  const platforms = leadPlatforms(lead);
  const platform = primaryPlatform(lead);
  const PlatformIcon = platformIcon(platform);
  const presence = getPlatformPresence(lead);
  const breakdown = lead.score_breakdown || {};
  const hasBreakdown = Object.keys(breakdown).length > 0;
  const isHot = score >= SCORE_THRESHOLD;
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(lead.notes || "");

  // sync note if lead changes
  useEffect(() => { setNoteText(lead.notes || ""); setEditingNote(false); }, [lead.id]);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#111] text-white shadow-[0_32px_80px_rgba(0,0,0,0.5)]">
      {/* ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: isHot
            ? "linear-gradient(135deg, rgba(0,245,212,0.12) 0%, transparent 40%), linear-gradient(225deg, rgba(255,45,85,0.18) 0%, transparent 45%), #111"
            : "linear-gradient(135deg, rgba(255,45,85,0.1) 0%, transparent 40%), #111"
        }}
      />

      {/* top bar */}
      <div className="relative flex items-center justify-between gap-2 border-b border-white/[0.07] px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-black text-white/35">{index + 1} / {total}</span>
          <span
            className="rounded-full px-2.5 py-1 text-[11px] font-black"
            style={{ background: stageColor(lead.pipeline_stage) + "22", color: stageColor(lead.pipeline_stage) }}
          >
            {lead.pipeline_stage}
          </span>
          {!isHot && score > 0 && (
            <span className="rounded-full bg-[#ff2d55]/20 px-2.5 py-1 text-[11px] font-black text-[#ff2d55]">Cold</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onPrevious} className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.06] text-white/60 hover:bg-white/10" title="Previous">
            <ChevronUp className="h-4 w-4" />
          </button>
          <button type="button" onClick={onNext} className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.06] text-white/60 hover:bg-white/10" title="Next">
            <ChevronDown className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => onDelete(lead)} className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.06] text-white/40 hover:bg-[#ff2d55]/20 hover:text-[#ff2d55]" title="Delete lead">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="relative grid gap-0 lg:grid-cols-[1fr_280px]">
        {/* left: identity + actions */}
        <div className="p-5">
          <div className="flex items-start gap-4">
            <LeadAvatar lead={lead} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {platformUrl(platform, lead) ? (
                  <a href={platformUrl(platform, lead)} target={platform === "email" ? "_self" : "_blank"} rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00f5d4] hover:underline">
                    <PlatformIcon className="h-4 w-4 shrink-0" />
                    {visibleHandle(lead)}
                  </a>
                ) : (
                  <>
                    <PlatformIcon className="h-4 w-4 shrink-0 text-[#00f5d4]" />
                    <span className="truncate text-xs font-bold text-white/55">{visibleHandle(lead)}</span>
                  </>
                )}
              </div>
              <h1 className="mt-1 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">{lead.name}</h1>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-[#00f5d4]">{lead.niche || lead.source || "opportunity"}</p>
            </div>
          </div>

          {/* platform links */}
          <div className="mt-4">
            <PlatformLinks lead={lead} size="md" />
          </div>

          {/* AI reasoning */}
          <p className="mt-4 text-sm leading-relaxed text-white/65">
            {lead.score_reason || lead.notes || "Hit Score to qualify this lead with AI."}
          </p>

          {/* notes */}
          <div className="mt-4 rounded-xl border border-white/[0.08] bg-black/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-white/35">Notes</span>
              <button type="button" onClick={() => { if (editingNote) { onNoteSave(lead, noteText); setEditingNote(false); } else setEditingNote(true); }} className="text-[11px] font-black text-[#00f5d4]">
                {editingNote ? "Save" : "Edit"}
              </button>
            </div>
            {editingNote ? (
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={3}
                autoFocus
                className="mt-2 w-full resize-none bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
                placeholder="Add notes about this lead..."
              />
            ) : (
              <p className="mt-1 text-sm text-white/55">{noteText || <span className="italic text-white/25">No notes yet.</span>}</p>
            )}
          </div>

          {/* pipeline stage buttons */}
          <div className="mt-4 grid grid-cols-5 gap-1.5">
            {PIPELINE_STAGES.map((stage) => (
              <button
                key={stage}
                type="button"
                onClick={() => onStage(lead, stage)}
                className={clsx(
                  "h-9 rounded-lg text-xs font-black transition",
                  lead.pipeline_stage === stage
                    ? "text-black"
                    : "bg-white/[0.06] text-white/55 hover:bg-white/10 hover:text-white"
                )}
                style={lead.pipeline_stage === stage ? { background: stageColor(stage) } : {}}
              >
                {stage}
              </button>
            ))}
          </div>

          {/* outreach status per platform */}
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {platforms.slice(0, 4).map((p) => (
              <div key={p} className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.08] bg-black/25 px-3 py-2">
                <span className="text-xs font-black text-white/60">{platformName(p)}</span>
                <StatusSelect lead={lead} platform={p} onChange={onStatus} dark />
              </div>
            ))}
          </div>

          {/* action buttons */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onMessage(lead, platform)}
              disabled={!isHot && score > 0}
              className={clsx(
                "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-black transition",
                isHot || score === 0
                  ? "bg-[#ff2d55] text-white hover:bg-[#ff4167]"
                  : "cursor-not-allowed bg-white/[0.06] text-white/30"
              )}
              title={!isHot && score > 0 ? `Score too low (${score.toFixed(1)}) — below ${SCORE_THRESHOLD} threshold` : "Generate outreach"}
            >
              <MessageCircle className="h-4 w-4" />
              {busy.startsWith(`message-${lead.id}`) ? "Writing..." : "Generate DM"}
            </button>
            <button
              type="button"
              onClick={() => onScore(lead)}
              disabled={busy === `score-${lead.id}`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 text-sm font-black text-white transition hover:bg-white/10 disabled:opacity-50"
            >
              <Sparkles className={clsx("h-4 w-4", busy === `score-${lead.id}` && "animate-spin")} />
              {busy === `score-${lead.id}` ? "Scoring..." : "Score"}
            </button>
            <button
              type="button"
              onClick={() => onPass(lead)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 text-sm font-black text-white/55 transition hover:bg-white/10"
            >
              <X className="h-4 w-4" />
              Pass
            </button>
          </div>
        </div>

        {/* right: score + deal value */}
        <div className="border-t border-white/[0.07] p-5 lg:border-l lg:border-t-0">
          {/* score card */}
          <div className="rounded-xl p-4" style={{ background: isHot ? "rgba(0,245,212,0.08)" : "rgba(255,45,85,0.08)", border: `1px solid ${scoreColor(score)}22` }}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: scoreColor(score) }}>
                {score > 0 ? scoreLabel(score) : "Unscored"}
              </span>
              <Target className="h-4 w-4" style={{ color: scoreColor(score) }} />
            </div>
            <div className="mt-1 text-5xl font-black" style={{ color: scoreColor(score) }}>
              {score > 0 ? score.toFixed(1) : "—"}
            </div>
            <div className="mt-1 text-xs text-white/35">out of 10</div>
          </div>

          {/* breakdown bars */}
          {hasBreakdown && (
            <div className="mt-4 grid gap-2.5">
              <span className="text-[11px] font-black uppercase tracking-widest text-white/35">Breakdown</span>
              {Object.entries(breakdown).map(([key, val]) => (
                SCORE_BREAKDOWN_LABELS[key] ? <ScoreBar key={key} label={SCORE_BREAKDOWN_LABELS[key]} value={val} /> : null
              ))}
            </div>
          )}

          {/* deal value */}
          <div className="mt-5">
            <label className="text-[11px] font-black uppercase tracking-widest text-white/35">Deal Value</label>
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3">
              <DollarSign className="h-4 w-4 text-white/35" />
              <input
                type="number"
                min="0"
                value={lead.deal_value || 0}
                onChange={(e) => onDealValue(lead, e.target.value)}
                className="h-11 w-full bg-transparent text-lg font-black text-white outline-none"
              />
            </div>
          </div>

          {/* contact info */}
          {(lead.email || lead.phone || lead.website || lead.address) && (
            <div className="mt-5 grid gap-1.5">
              <span className="text-[11px] font-black uppercase tracking-widest text-white/35">Contact</span>
              {lead.email && <a href={`mailto:${lead.email}`} className="truncate text-xs text-[#00f5d4] hover:underline">{lead.email}</a>}
              {lead.phone && <span className="text-xs text-white/55">{lead.phone}</span>}
              {lead.website && <a href={lead.website} target="_blank" rel="noopener noreferrer" className="truncate text-xs text-white/40 hover:text-white/70">{lead.website}</a>}
              {lead.address && <span className="text-xs text-white/40">{lead.address}</span>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function LeadStrip({ leads, selectedLeadId, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 lg:block lg:max-h-[540px] lg:space-y-2 lg:overflow-y-auto lg:overflow-x-hidden lg:pr-1">
      {leads.map((lead) => {
        const score = Number(lead.ai_score || 0);
        const isHot = score >= SCORE_THRESHOLD;
        const isSelected = selectedLeadId === lead.id;
        return (
          <button
            key={lead.id}
            type="button"
            onClick={() => onSelect(lead.id)}
            className={clsx(
              "min-w-[200px] rounded-xl border p-3 text-left transition lg:min-w-0 lg:w-full",
              isSelected ? "border-[#00f5d4]/40 bg-[#00f5d4]/[0.07]" : "border-white/[0.07] bg-white/[0.04] hover:border-white/15"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-black text-white">{lead.name}</span>
              {score > 0 && (
                <span className="shrink-0 text-xs font-black" style={{ color: scoreColor(score) }}>
                  {score.toFixed(1)}
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="truncate text-xs text-white/40">{visibleHandle(lead)}</span>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black"
                style={{ background: stageColor(lead.pipeline_stage) + "22", color: stageColor(lead.pipeline_stage) }}
              >
                {lead.pipeline_stage}
              </span>
            </div>
            {!isHot && score > 0 && (
              <div className="mt-1.5 text-[10px] font-black text-[#ff2d55]/70">Below threshold</div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function FinderPanel({ source, setSource, keyword, setKeyword, city, setCity, manualText, setManualText, saveResults, setSaveResults, searchResults, busy, onSubmit, onAdd }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[400px_1fr]">
      <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <h2 className="text-2xl font-black text-white">Find leads</h2>
        <p className="mt-1 text-sm text-white/45">Search YouTube, Instagram, and Maps in one run.</p>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {sourceOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSource(opt.id)}
                className={clsx(
                  "inline-flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-black transition",
                  source === opt.id ? "border-[#00f5d4] bg-[#00f5d4] text-black" : "border-white/10 bg-black/20 text-white/70 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className="mt-5 space-y-3">
          {source === "auto" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Niche or client type" className="h-12 rounded-xl border border-white/10 bg-black/40 px-4 text-sm text-white placeholder:text-white/30" />
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City for Maps" className="h-12 rounded-xl border border-white/10 bg-black/40 px-4 text-sm text-white placeholder:text-white/30" />
            </div>
          ) : source === "maps" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Business type" className="h-12 rounded-xl border border-white/10 bg-black/40 px-4 text-sm text-white placeholder:text-white/30" />
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="h-12 rounded-xl border border-white/10 bg-black/40 px-4 text-sm text-white placeholder:text-white/30" />
            </div>
          ) : source === "manual" ? (
            <textarea value={manualText} onChange={(e) => setManualText(e.target.value)} placeholder="Paste handles, one per line" rows={6} className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30" />
          ) : (
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Niche keyword" className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-sm text-white placeholder:text-white/30" />
          )}

          <label className="inline-flex items-center gap-2 text-xs font-black text-white/50">
            <input type="checkbox" checked={saveResults} onChange={(e) => setSaveResults(e.target.checked)} className="h-4 w-4 accent-[#00f5d4]" />
            Save results to database
          </label>

          <button type="submit" disabled={busy === "search"} className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#ff2d55] py-3 text-sm font-black text-white transition hover:bg-[#ff4167] disabled:opacity-60">
            <Search className="h-4 w-4" />
            {busy === "search" ? "Searching..." : source === "auto" ? "Run automated search" : "Find leads"}
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-black text-white">Results</h2>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-black text-white/50">{searchResults.length} found</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {searchResults.length ? (
            searchResults.map((lead) => {
              const totalFollowers = Object.values(lead.follower_counts || {}).reduce((s, v) => s + Number(v || 0), 0);
              const pScore = Number(lead.ai_score || 0);
              return (
                <article key={`${lead.source}-${lead.name}`} className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <LeadAvatar lead={lead} size="md" />
                    {pScore > 0 && (
                      <span className="text-sm font-black" style={{ color: scoreColor(pScore) }}>{pScore.toFixed(1)}</span>
                    )}
                  </div>
                  <h3 className="mt-3 line-clamp-2 text-base font-black text-white">{lead.name}</h3>
                  <p className="mt-0.5 truncate text-xs text-white/45">{lead.niche || lead.source}</p>
                  {totalFollowers > 0 && (
                    <p className="mt-1 text-xs font-black text-[#00f5d4]">{formatCount(totalFollowers)} total followers</p>
                  )}
                  {lead.address && <p className="mt-0.5 truncate text-xs text-white/35">{lead.address}</p>}
                  <div className="mt-2">
                    <PlatformLinks lead={lead} size="sm" />
                  </div>
                  <button type="button" onClick={() => onAdd(lead)} className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-black text-black hover:bg-white/90">
                    <Plus className="h-4 w-4" />
                    Add to queue
                  </button>
                </article>
              );
            })
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-white/35 md:col-span-2 xl:col-span-3">
              Run a search to pull leads.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MessagePanel({ messagePanel, onCopy, onMarkSent, onClose }) {
  const msgLen = messagePanel?.message?.length || 0;
  const dmWarning = msgLen > 800;

  if (!messagePanel) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <h2 className="text-2xl font-black text-white">Message Studio</h2>
        <p className="mt-2 text-sm text-white/45">Generate a DM from any lead in the queue. Only hot leads (score ≥ {SCORE_THRESHOLD}) are eligible.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#00f5d4]/20 bg-[#00f5d4]/[0.05] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-black uppercase tracking-widest text-[#00f5d4]">{messagePanel.provider || "AI"} · {platformName(messagePanel.platform)}</div>
          <h2 className="mt-1 text-2xl font-black text-white">{messagePanel.lead.name}</h2>
          {messagePanel.followUp && <p className="mt-0.5 text-xs font-black text-[#ffb703]">Follow-up message</p>}
        </div>
        <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      {messagePanel.subject && (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-black text-white">
          Subject: {messagePanel.subject}
        </div>
      )}

      <pre className="mt-3 max-h-[400px] overflow-auto whitespace-pre-wrap rounded-xl border border-white/[0.08] bg-black/30 p-4 text-sm leading-7 text-white/90">
        {messagePanel.message}
      </pre>

      <div className="mt-2 flex items-center justify-between text-[11px] font-black">
        <span className={dmWarning ? "text-[#ff2d55]" : "text-white/30"}>
          {msgLen} chars {dmWarning ? "— trim before sending" : ""}
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => onCopy(`${messagePanel.subject ? `${messagePanel.subject}\n\n` : ""}${messagePanel.message}`)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] text-sm font-black text-white hover:bg-white/10">
          <Copy className="h-4 w-4" />
          Copy
        </button>
        <button type="button" onClick={() => onMarkSent(messagePanel.lead, messagePanel.platform, messagePanel.message)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#ff2d55] text-sm font-black text-white hover:bg-[#ff4167]">
          <Send className="h-4 w-4" />
          Mark as Sent
        </button>
      </div>
    </div>
  );
}

function PipelineView({ leads, filteredLeads, onDragStart, onDropStage, onSelect }) {
  const totalRevenue = leads.filter((l) => l.pipeline_stage === "Closed").reduce((s, l) => s + Number(l.deal_value || 0), 0);
  const pipelineValue = leads.filter((l) => l.pipeline_stage === "Booked").reduce((s, l) => s + Number(l.deal_value || 0), 0);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-white">Close board</h2>
          <p className="mt-0.5 text-sm text-white/45">{leads.length} leads · ${pipelineValue.toLocaleString()} in pipeline · ${totalRevenue.toLocaleString()} closed</p>
        </div>
        <Flame className="h-6 w-6 text-[#ff2d55]" />
      </div>
      <div className="grid gap-3 xl:grid-cols-5">
        {PIPELINE_STAGES.map((stage) => {
          const stageLeads = filteredLeads.filter((l) => l.pipeline_stage === stage);
          const stageRevenue = stageLeads.reduce((s, l) => s + Number(l.deal_value || 0), 0);
          return (
            <div
              key={stage}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDropStage(e, stage)}
              className="min-h-[260px] rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3"
              style={{ borderTop: `2px solid ${stageColor(stage)}` }}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-sm font-black" style={{ color: stageColor(stage) }}>{stage}</h3>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-black text-white/50">{stageLeads.length}</span>
              </div>
              {stageRevenue > 0 && (
                <p className="mb-2 text-[11px] font-black text-white/35">${stageRevenue.toLocaleString()}</p>
              )}
              <div className="space-y-2">
                {stageLeads.map((lead) => (
                  <button
                    key={lead.id}
                    type="button"
                    draggable
                    onDragStart={(e) => onDragStart(e, lead)}
                    onClick={() => onSelect(lead.id)}
                    className="w-full rounded-xl border border-white/[0.07] bg-white/[0.05] p-3 text-left transition hover:border-white/20"
                  >
                    <div className="flex items-center gap-2">
                      <LeadAvatar lead={lead} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-black text-white">{lead.name}</span>
                          {lead.ai_score > 0 && <span className="text-xs font-black" style={{ color: scoreColor(Number(lead.ai_score)) }}>{Number(lead.ai_score).toFixed(1)}</span>}
                        </div>
                        <div className="mt-0.5 truncate text-xs text-white/40">{lead.niche || visibleHandle(lead)}</div>
                      </div>
                    </div>
                    {Number(lead.deal_value || 0) > 0 && (
                      <div className="mt-1.5 text-xs font-black text-[#16ff7a]">${Number(lead.deal_value).toLocaleString()}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── main app ────────────────────────────────────────────────────────────────

export default function ShortsAgencyOS() {
  const isDemo = useIsDemo();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [leads, setLeads] = useState(seedLeads);
  const [selectedLeadId, setSelectedLeadId] = useState(seedLeads[0].id);
  const [view, setView] = useState("feed");
  const [source, setSource] = useState("auto");
  const [keyword, setKeyword] = useState("business podcast");
  const [city, setCity] = useState("Austin");
  const [manualText, setManualText] = useState("@founderslabpod\nhttps://x.com/mayaopsdaily");
  const [searchResults, setSearchResults] = useState([]);
  const [saveResults, setSaveResults] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [hotOnly, setHotOnly] = useState(false);
  const [nicheFilter, setNicheFilter] = useState("");
  const [messagePanel, setMessagePanel] = useState(null);
  const [dealValueModal, setDealValueModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState("");

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session || null);
      if (data.session) loadLeads(data.session);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) loadLeads(s);
    });
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  async function request(path, options = {}) {
    const res = await fetch(path, {
      ...options,
      headers: { "content-type": "application/json", ...authHeaders(session), ...(options.headers || {}) }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed.");
    return data;
  }

  async function loadLeads(activeSession = session) {
    if (!activeSession) return;
    try {
      setBusy("load");
      const res = await fetch("/api/leads", { headers: authHeaders(activeSession) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load leads.");
      if (data.leads?.length) { setLeads(data.leads); setSelectedLeadId(data.leads[0].id); }
    } catch (e) { setError(e.message); } finally { setBusy(""); }
  }

  async function signIn() {
    if (!supabase) return;
    setAuthMessage("");
    const { error: e } = await supabase.auth.signInWithPassword({ email, password });
    setAuthMessage(e ? e.message : "Signed in.");
  }

  async function signUp() {
    if (!supabase) return;
    setAuthMessage("");
    const { error: e } = await supabase.auth.signUp({ email, password });
    setAuthMessage(e ? e.message : "Account created. Check your email.");
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setLeads(seedLeads);
    setSelectedLeadId(seedLeads[0].id);
  }

  function mergeLead(nextLead) {
    setLeads((cur) => {
      const exists = cur.some((l) => l.id === nextLead.id);
      return exists ? cur.map((l) => (l.id === nextLead.id ? { ...l, ...nextLead } : l)) : [nextLead, ...cur];
    });
    setSelectedLeadId(nextLead.id);
  }

  function removeLead(leadId) {
    setLeads((cur) => cur.filter((l) => l.id !== leadId));
    setSelectedLeadId((cur) => cur === leadId ? leads.find((l) => l.id !== leadId)?.id || null : cur);
  }

  async function addLead(lead) {
    if (isDemo) return;
    try {
      if (session) {
        const data = await request("/api/leads", { method: "POST", body: JSON.stringify(lead) });
        mergeLead(data.lead);
      } else {
        mergeLead({ ...lead, id: crypto.randomUUID(), created_at: new Date().toISOString(), pipeline_stage: "Prospect", outreach_statuses: [] });
      }
      setView("feed");
    } catch (e) { setError(e.message); }
  }

  async function deleteLead(lead) {
    if (isDemo) return;
    if (session) {
      try { await request(`/api/leads/${lead.id}`, { method: "DELETE" }); } catch (e) { setError(e.message); return; }
    }
    removeLead(lead.id);
    setDeleteConfirm(null);
    showToast("Lead removed.");
  }

  async function runLeadSearch(e) {
    e.preventDefault();
    if (isDemo) return;
    setError("");
    setMessagePanel(null);
    setBusy("search");
    try {
      const endpoint = source === "auto" ? "/api/leads/autopilot"
        : source === "youtube" ? "/api/leads/search/youtube"
        : source === "instagram" ? "/api/leads/search/instagram"
        : source === "maps" ? "/api/leads/search/maps"
        : "/api/leads/import";

      const body = source === "auto" ? { keyword, category: keyword, city, save: saveResults, includeFiltered: true }
        : source === "maps" ? { category: keyword, city, save: saveResults }
        : source === "manual" ? { text: manualText, niche: keyword, save: saveResults }
        : { keyword, save: saveResults };

      const data = await request(endpoint, { method: "POST", body: JSON.stringify(body) });
      const saved = data.saved || [];
      if (saved.length) { saved.forEach(mergeLead); setSearchResults(saved); }
      else setSearchResults(data.leads || []);
    } catch (e) { setError(e.message); } finally { setBusy(""); }
  }

  async function scoreLead(lead) {
    if (isDemo) return;
    setBusy(`score-${lead.id}`);
    setError("");
    try {
      const data = await request("/api/ai/score", { method: "POST", body: JSON.stringify({ lead }) });
      mergeLead(data.lead);
    } catch (e) { setError(e.message); } finally { setBusy(""); }
  }

  async function scoreAllHot() {
    if (isDemo) return;
    const toScore = leads.filter((l) => !l.ai_score || l.ai_score === 0);
    if (!toScore.length) { showToast("All leads already scored."); return; }
    setBusy("score-all");
    for (const lead of toScore) {
      try {
        const data = await request("/api/ai/score", { method: "POST", body: JSON.stringify({ lead }) });
        mergeLead(data.lead);
      } catch {}
    }
    setBusy("");
    showToast(`Scored ${toScore.length} leads.`);
  }

  async function generateMessage(lead, platform, followUp = false) {
    const score = Number(lead.ai_score || 0);
    if (score > 0 && score < SCORE_THRESHOLD) {
      setError(`${lead.name} scored ${score.toFixed(1)} — below ${SCORE_THRESHOLD} threshold. Re-score or pass.`);
      return;
    }
    setBusy(`message-${lead.id}-${platform}`);
    setError("");
    try {
      const data = await request("/api/ai/message", { method: "POST", body: JSON.stringify({ lead, platform, followUp }) });
      setMessagePanel({ lead, platform, ...data, followUp });
      setView("dms");
    } catch (e) { setError(e.message); } finally { setBusy(""); }
  }

  async function copyMessage(text) {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(text);
    showToast("Copied to clipboard.");
  }

  async function changeStatus(lead, platform, status, extra = {}) {
    if (isDemo) return;
    const nextLead = upsertStatus(lead, platform, status, extra);
    mergeLead(nextLead);
    if (!session) return;
    try {
      await request(`/api/leads/${lead.id}`, {
        method: "PATCH",
        body: JSON.stringify({ outreach: { platform, status, extra }, lead: { pipeline_stage: nextLead.pipeline_stage } })
      });
    } catch (e) { setError(e.message); }
  }

  async function moveStage(lead, stage) {
    if (isDemo) return;
    mergeLead({ ...lead, pipeline_stage: stage });
    if ((stage === "Booked" || stage === "Closed") && Number(lead.deal_value || 0) === 0) {
      setDealValueModal({ lead: { ...lead, pipeline_stage: stage }, stage });
    }
    if (!session) return;
    try { await request(`/api/leads/${lead.id}`, { method: "PATCH", body: JSON.stringify({ lead: { pipeline_stage: stage } }) }); }
    catch (e) { setError(e.message); }
  }

  async function updateDealValue(lead, value) {
    const dealValue = Number(value || 0);
    mergeLead({ ...lead, deal_value: dealValue });
    if (!session) return;
    try { await request(`/api/leads/${lead.id}`, { method: "PATCH", body: JSON.stringify({ lead: { deal_value: dealValue } }) }); }
    catch (e) { setError(e.message); }
  }

  async function saveNote(lead, note) {
    mergeLead({ ...lead, notes: note });
    if (!session) return;
    try { await request(`/api/leads/${lead.id}`, { method: "PATCH", body: JSON.stringify({ lead: { notes: note } }) }); }
    catch (e) { setError(e.message); }
  }

  async function runDueFollowups() {
    setBusy("followups");
    setError("");
    try {
      const data = await request("/api/followups/due", { method: "POST", body: JSON.stringify({}) });
      if (data.generated?.[0]) {
        setMessagePanel({ lead: data.generated[0].lead, platform: data.generated[0].platform, message: data.generated[0].message, provider: data.generated[0].provider, followUp: true });
      }
      showToast(`${data.generated?.length || 0} follow-ups generated.`);
      if (session) loadLeads();
    } catch (e) { setError(e.message); } finally { setBusy(""); }
  }

  function onDragStart(e, lead) { e.dataTransfer.setData("text/plain", lead.id); }
  function onDropStage(e, stage) {
    e.preventDefault();
    const lead = leads.find((l) => l.id === e.dataTransfer.getData("text/plain"));
    if (lead) moveStage(lead, stage);
  }

  function selectByOffset(offset) {
    if (!filteredLeads.length) return;
    const idx = Math.max(0, filteredLeads.findIndex((l) => l.id === selectedLeadId));
    setSelectedLeadId(filteredLeads[(idx + offset + filteredLeads.length) % filteredLeads.length].id);
  }

  function passLead(lead) { moveStage(lead, "Prospect"); selectByOffset(1); }

  const filteredLeads = leads.filter((lead) => {
    const matchesNiche = !nicheFilter || (lead.niche || "").toLowerCase().includes(nicheFilter.toLowerCase());
    const matchesHot = !hotOnly || Number(lead.ai_score || 0) >= SCORE_THRESHOLD;
    return matchesNiche && matchesHot;
  });

  const activeLead = filteredLeads.find((l) => l.id === selectedLeadId) || filteredLeads[0];
  const activeIndex = Math.max(0, filteredLeads.findIndex((l) => l.id === activeLead?.id));

  useEffect(() => {
    function onKeyDown(e) {
      const tag = e.target?.tagName?.toLowerCase();
      if (["input", "textarea", "select"].includes(tag)) return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); selectByOffset(1); }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); selectByOffset(-1); }
      if (e.key.toLowerCase() === "m" && activeLead) generateMessage(activeLead, primaryPlatform(activeLead));
      if (e.key.toLowerCase() === "s" && activeLead) scoreLead(activeLead);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeLead, selectedLeadId, filteredLeads.length]);

  // analytics
  const statuses = leads.flatMap(getStatuses);
  const sent = statuses.filter((s) => ["Sent", "Replied", "Booked", "Closed"].includes(s.status)).length;
  const replies = statuses.filter((s) => ["Replied", "Booked", "Closed"].includes(s.status)).length;
  const replyRate = sent > 0 ? Math.round((replies / sent) * 100) : 0;
  const closedRevenue = leads.filter((l) => l.pipeline_stage === "Closed").reduce((s, l) => s + Number(l.deal_value || 0), 0);
  const hotCount = leads.filter((l) => Number(l.ai_score || 0) >= SCORE_THRESHOLD).length;
  const dueFollowups = leads.filter((l) => getStatuses(l).some((s) => s.status === "Sent" && s.next_follow_up_at && new Date(s.next_follow_up_at) <= new Date()));
  const unscoredCount = leads.filter((l) => !l.ai_score || l.ai_score === 0).length;

  return (
    <main className="min-h-screen bg-[#060606] px-4 pb-28 pt-4 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1480px] space-y-5">

        {/* demo banner */}
        {isDemo && (
          <div className="sticky top-0 z-40 -mx-4 flex items-center justify-center gap-2 bg-[#FFB703]/10 border-b border-[#FFB703]/20 px-4 py-2 text-xs font-black text-[#FFB703] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Demo mode — read only. Sign in to make changes.
          </div>
        )}
        {/* header */}
        <header className="sticky top-0 z-30 -mx-4 border-b border-white/[0.07] bg-[#060606]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4">
            <button type="button" onClick={() => setView("feed")} className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#ff2d55] shadow-[0_0_24px_rgba(255,45,85,0.5)]">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 hidden sm:block">
                <div className="text-base font-black leading-none">Shorts Agency OS</div>
                <div className="mt-0.5 text-[11px] text-white/35">outreach workspace</div>
              </div>
            </button>

            <nav className="hidden items-center gap-1 rounded-2xl border border-white/[0.07] bg-white/[0.04] p-1 md:flex">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.id} type="button" onClick={() => setView(item.id)}
                    className={clsx("inline-flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-black transition",
                      view === item.id ? "bg-white text-black" : "text-white/50 hover:text-white")}>
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              {unscoredCount > 0 && (
                <button type="button" onClick={scoreAllHot} disabled={busy === "score-all"} title={`Score ${unscoredCount} unscored leads`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.06] px-3 text-xs font-black text-white/70 hover:text-white disabled:opacity-50">
                  <Sparkles className={clsx("h-3.5 w-3.5", busy === "score-all" && "animate-spin")} />
                  Score all ({unscoredCount})
                </button>
              )}
              <button type="button" onClick={() => session && loadLeads()} className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.04] text-white/50 hover:text-white">
                <RefreshCw className={clsx("h-4 w-4", busy === "load" && "animate-spin")} />
              </button>
              <button type="button" onClick={() => setView("hunt")} className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#00f5d4] px-4 text-sm font-black text-black">
                <Plus className="h-4 w-4" />
                Find
              </button>
            </div>
          </div>
        </header>

        {/* error */}
        {error ? (
          <div className="flex items-start gap-3 rounded-2xl border border-[#ff2d55]/30 bg-[#ff2d55]/[0.08] p-4 text-sm text-white">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#ff2d55]" />
            <span className="flex-1">{error}</span>
            <button type="button" onClick={() => setError("")} className="text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
          </div>
        ) : null}

        {/* KPIs */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MiniMetric icon={Flame} label="Hot Leads" value={hotCount} accent="#00f5d4" />
          <MiniMetric icon={Send} label="Sent" value={sent} />
          <MiniMetric icon={MessageCircle} label="Reply Rate" value={`${replyRate}%`} accent={replyRate >= 20 ? "#00f5d4" : replyRate >= 10 ? "#ffb703" : "#ff2d55"} />
          <MiniMetric icon={DollarSign} label="Closed Revenue" value={`$${closedRevenue.toLocaleString()}`} accent={closedRevenue > 0 ? "#16ff7a" : "white"} />
        </section>

        {/* feed */}
        {view === "feed" ? (
          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              {/* filters */}
              <div className="flex flex-wrap items-center gap-2">
                <input value={nicheFilter} onChange={(e) => setNicheFilter(e.target.value)} placeholder="Filter by niche..."
                  className="h-10 min-w-[200px] flex-1 rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 text-sm text-white placeholder:text-white/30" />
                <button type="button" onClick={() => setHotOnly((v) => !v)}
                  className={clsx("inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-black transition",
                    hotOnly ? "border-[#00f5d4] bg-[#00f5d4] text-black" : "border-white/[0.07] bg-white/[0.04] text-white/60 hover:text-white")}>
                  <Flame className="h-4 w-4" />
                  Hot only
                </button>
              </div>

              {activeLead ? (
                <LeadReel
                  lead={activeLead}
                  index={activeIndex}
                  total={filteredLeads.length}
                  busy={busy}
                  onPass={passLead}
                  onDelete={(lead) => setDeleteConfirm(lead)}
                  onNext={() => selectByOffset(1)}
                  onPrevious={() => selectByOffset(-1)}
                  onScore={scoreLead}
                  onMessage={generateMessage}
                  onStatus={changeStatus}
                  onStage={moveStage}
                  onDealValue={updateDealValue}
                  onNoteSave={saveNote}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-white/35">
                  {hotOnly ? "No hot leads — lower the filter or score more leads." : "No leads. Hit Find to pull some."}
                </div>
              )}
            </div>

            <aside className="space-y-4">
              <AuthStrip supabase={supabase} session={session} email={email} password={password} setEmail={setEmail} setPassword={setPassword} onSignIn={signIn} onSignUp={signUp} onSignOut={signOut} message={authMessage} />

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-sm font-black uppercase tracking-widest text-white/50">Queue</h2>
                  <span className="text-xs font-black text-white/30">{filteredLeads.length}</span>
                </div>
                <LeadStrip leads={filteredLeads} selectedLeadId={activeLead?.id} onSelect={setSelectedLeadId} />
              </div>

              {dueFollowups.length > 0 && (
                <div className="rounded-2xl border border-[#ffb703]/20 bg-[#ffb703]/[0.06] p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CalendarClock className="h-4 w-4 text-[#ffb703]" />
                      <h2 className="text-sm font-black text-[#ffb703]">Follow-ups due</h2>
                    </div>
                    <span className="rounded-full bg-[#ffb703] px-2 py-0.5 text-xs font-black text-black">{dueFollowups.length}</span>
                  </div>
                  <button type="button" onClick={runDueFollowups} disabled={!session || busy === "followups"}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#ffb703] text-sm font-black text-black disabled:opacity-40">
                    {busy === "followups" ? "Generating..." : "Generate follow-ups"}
                  </button>
                </div>
              )}
            </aside>
          </section>
        ) : null}

        {view === "hunt" ? (
          <FinderPanel source={source} setSource={setSource} keyword={keyword} setKeyword={setKeyword} city={city} setCity={setCity} manualText={manualText} setManualText={setManualText} saveResults={saveResults} setSaveResults={setSaveResults} searchResults={searchResults} busy={busy} onSubmit={runLeadSearch} onAdd={addLead} />
        ) : null}

        {view === "dms" ? (
          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <MessagePanel messagePanel={messagePanel} onCopy={copyMessage} onClose={() => setMessagePanel(null)} onMarkSent={(lead, platform, message) => changeStatus(lead, platform, "Sent", { last_message: message })} />
            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-widest text-white/30">All leads — click to generate</p>
              {leads.map((lead) => {
                const platform = primaryPlatform(lead);
                const score = Number(lead.ai_score || 0);
                const isHot = score >= SCORE_THRESHOLD || score === 0;
                return (
                  <button key={lead.id} type="button" onClick={() => generateMessage(lead, platform)}
                    className={clsx("flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition",
                      isHot ? "border-white/[0.07] bg-white/[0.03] hover:border-white/15" : "border-white/[0.04] bg-white/[0.02] opacity-50 cursor-not-allowed")}
                    disabled={!isHot}
                    title={!isHot ? `Score ${score.toFixed(1)} — below threshold` : undefined}
                  >
                    <LeadAvatar lead={lead} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-black text-white">{lead.name}</div>
                      <div className="truncate text-xs text-white/35">{platformName(platform)} · {visibleHandle(lead)}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {score > 0 && <span className="text-xs font-black" style={{ color: scoreColor(score) }}>{score.toFixed(1)}</span>}
                      <Send className="h-3.5 w-3.5 text-[#00f5d4]" />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {view === "pipeline" ? (
          <PipelineView leads={leads} filteredLeads={filteredLeads} onDragStart={onDragStart} onDropStage={onDropStage} onSelect={(id) => { setSelectedLeadId(id); setView("feed"); }} />
        ) : null}
      </div>

      {/* mobile nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.07] bg-[#060606]/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} type="button" onClick={() => setView(item.id)}
                className={clsx("grid h-14 place-items-center rounded-xl text-[11px] font-black",
                  view === item.id ? "bg-white text-black" : "bg-white/[0.05] text-white/50")}>
                <Icon className="h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* toast */}
      {toast ? (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-white/10 bg-[#111] px-5 py-3 text-sm font-black text-white shadow-2xl">
          {toast}
        </div>
      ) : null}

      {/* delete confirm */}
      {deleteConfirm ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#111] p-6 shadow-2xl">
            <Trash2 className="h-8 w-8 text-[#ff2d55]" />
            <h3 className="mt-3 text-lg font-black text-white">Delete {deleteConfirm.name}?</h3>
            <p className="mt-1 text-sm text-white/45">This is permanent. All outreach history for this lead goes with it.</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setDeleteConfirm(null)} className="h-11 rounded-xl bg-white/10 text-sm font-black text-white">Cancel</button>
              <button type="button" onClick={() => deleteLead(deleteConfirm)} className="h-11 rounded-xl bg-[#ff2d55] text-sm font-black text-white">Delete</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* deal value modal */}
      {dealValueModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#111] p-6 shadow-2xl">
            <DollarSign className="h-7 w-7 text-[#00f5d4]" />
            <h3 className="mt-2 text-lg font-black text-white">What did this deal close for?</h3>
            <p className="mt-1 text-sm text-white/45"><span className="font-black text-white">{dealValueModal.lead.name}</span> just moved to <span className="font-black text-[#00f5d4]">{dealValueModal.stage}</span>.</p>
            <DealValueInput lead={dealValueModal.lead} onSave={(v) => { updateDealValue(dealValueModal.lead, v); setDealValueModal(null); }} onSkip={() => setDealValueModal(null)} />
          </div>
        </div>
      ) : null}
    </main>
  );
}

function DealValueInput({ lead, onSave, onSkip }) {
  const [val, setVal] = useState(String(lead.deal_value || ""));
  return (
    <div className="mt-4 grid gap-3">
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-white/35">$</span>
        <input type="number" min="0" step="100" value={val} onChange={(e) => setVal(e.target.value)} placeholder="2500" autoFocus
          className="h-13 w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-8 pr-4 text-xl font-black text-white placeholder:text-white/20 focus:border-[#00f5d4] focus:outline-none" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onSkip} className="h-11 rounded-xl bg-white/[0.07] text-sm font-black text-white/60">Skip</button>
        <button type="button" onClick={() => onSave(Number(val || 0))} className="h-11 rounded-xl bg-[#00f5d4] text-sm font-black text-black">Save</button>
      </div>
    </div>
  );
}
