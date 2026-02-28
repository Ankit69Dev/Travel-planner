"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Loader from "@/components/ui/loader";

interface Badge {
  id: string;
  name: string;
  tag: string;
  emoji: string;
  description: string;
  requiredTrips: number;
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond" | "legend";
  xp: number;
  color: string;
  glow: string;
  borderColor: string;
  bg: string;
}

const ALL_BADGES: Badge[] = [
  {
    id: "rookie",
    name: "Rookie Traveller",
    tag: "Just Getting Started",
    emoji: "🥉",
    description: "You took your first step into the world. Every legend starts somewhere.",
    requiredTrips: 1,
    tier: "bronze",
    xp: 100,
    color: "text-amber-600",
    glow: "shadow-amber-700/40",
    borderColor: "border-amber-700/60",
    bg: "from-amber-950/60 to-amber-900/20",
  },
  {
    id: "wanderer",
    name: "The Wanderer",
    tag: "Finding Your Path",
    emoji: "🎒",
    description: "You've explored 3 destinations. The wanderlust is real.",
    requiredTrips: 3,
    tier: "silver",
    xp: 250,
    color: "text-slate-300",
    glow: "shadow-slate-400/40",
    borderColor: "border-slate-400/60",
    bg: "from-slate-800/60 to-slate-700/20",
  },
  {
    id: "explorer",
    name: "Bold Explorer",
    tag: "Beyond the Map",
    emoji: "🧭",
    description: "5 trips in. You don't just travel — you explore. The unknown calls you.",
    requiredTrips: 5,
    tier: "gold",
    xp: 500,
    color: "text-yellow-400",
    glow: "shadow-yellow-400/40",
    borderColor: "border-yellow-400/60",
    bg: "from-yellow-950/60 to-yellow-900/20",
  },
  {
    id: "adventurer",
    name: "Seasoned Adventurer",
    tag: "No Road Too Rough",
    emoji: "⛺",
    description: "10 trips planned. You've seen sunsets on strange horizons and loved it.",
    requiredTrips: 10,
    tier: "platinum",
    xp: 1000,
    color: "text-cyan-300",
    glow: "shadow-cyan-300/40",
    borderColor: "border-cyan-300/60",
    bg: "from-cyan-950/60 to-cyan-900/20",
  },
  {
    id: "nomad",
    name: "Digital Nomad",
    tag: "The World is Home",
    emoji: "🌍",
    description: "15 destinations explored. Borders are just suggestions to you.",
    requiredTrips: 15,
    tier: "diamond",
    xp: 2000,
    color: "text-violet-300",
    glow: "shadow-violet-400/50",
    borderColor: "border-violet-400/60",
    bg: "from-violet-950/60 to-violet-900/20",
  },
  {
    id: "legend",
    name: "Travel Legend",
    tag: "Icon of the Road",
    emoji: "👑",
    description: "20+ trips. You are the trip. Stories follow you everywhere you go.",
    requiredTrips: 20,
    tier: "legend",
    xp: 5000,
    color: "text-yellow-300",
    glow: "shadow-yellow-300/60",
    borderColor: "border-yellow-300/70",
    bg: "from-yellow-900/60 to-orange-900/30",
  },
];

// XP thresholds between badge levels
const XP_PER_TRIP = 120;
const BONUS_XP_DESTINATIONS = 30; // per unique destination

function computeGamification(trips: any[]) {
  const tripCount = trips.length;
  const totalXP = tripCount * XP_PER_TRIP +
    new Set(trips.map((t) => t.destination)).size * BONUS_XP_DESTINATIONS;

  // Earned badges = all badges where tripCount >= requiredTrips
  const earned = ALL_BADGES.filter((b) => tripCount >= b.requiredTrips);
  const currentBadge = earned[earned.length - 1] ?? null;

  // Next badge to earn
  const nextBadge = ALL_BADGES.find((b) => tripCount < b.requiredTrips) ?? null;
  const tripsToNext = nextBadge ? nextBadge.requiredTrips - tripCount : 0;
  const progressPct = nextBadge
    ? ((tripCount - (currentBadge?.requiredTrips ?? 0)) /
        (nextBadge.requiredTrips - (currentBadge?.requiredTrips ?? 0))) *
      100
    : 100;

  return { earned, currentBadge, nextBadge, tripsToNext, progressPct, totalXP, tripCount };
}

// ─────────────────────────────────────────────────────────────────────────────
// BADGE CARD COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function BadgeCard({
  badge,
  unlocked,
  isActive,
}: {
  badge: Badge;
  unlocked: boolean;
  isActive: boolean;
}) {
  const TIER_LABELS: Record<string, string> = {
    bronze: "Bronze", silver: "Silver", gold: "Gold",
    platinum: "Platinum", diamond: "Diamond", legend: "Legend",
  };

  return (
    <div
      className={`relative rounded-2xl border p-4 transition-all duration-300 flex flex-col items-center text-center gap-2
        ${unlocked
          ? `bg-gradient-to-b ${badge.bg} ${badge.borderColor} shadow-lg ${badge.glow}`
          : "bg-white/3 border-white/10 opacity-40 grayscale"
        }
        ${isActive ? "ring-2 ring-offset-2 ring-offset-black ring-purple-500 scale-105" : ""}
      `}
    >
      {/* Active crown */}
      {isActive && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full font-bold">
          ACTIVE
        </span>
      )}

      {/* Locked overlay */}
      {!unlocked && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl z-10">
          <div className="bg-black/60 rounded-full p-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
      )}

      {/* Emoji */}
      <span
        className={`text-4xl transition-all duration-500 ${unlocked ? "drop-shadow-lg" : ""}`}
        style={unlocked ? { filter: "drop-shadow(0 0 8px currentColor)" } : {}}
      >
        {badge.emoji}
      </span>

      {/* Tier chip */}
      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${badge.borderColor} ${badge.color} bg-black/30`}>
        {TIER_LABELS[badge.tier]}
      </span>

      <div>
        <p className={`font-bold text-l ${unlocked ? badge.color : "text-gray-500"}`}>
          {badge.name}
        </p>
        <p className="text-gray-400 text-[15px] mt-0.5 italic">{badge.tag}</p>
      </div>

      <p className="text-gray-500 text-[12px] leading-snug line-clamp-2">{badge.description}</p>

      <div className="flex items-center gap-1 mt-1">
        <span className="text-yellow-400 text-xs">⚡</span>
        <span className={`text-m font-mono ${unlocked ? "text-yellow-300" : "text-gray-600"}`}>
          {badge.xp} XP
        </span>
      </div>

      <div className={`text-[12px] ${unlocked ? "text-gray-400" : "text-gray-600"}`}>
        Requires {badge.requiredTrips} trip{badge.requiredTrips > 1 ? "s" : ""}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN GAMIFICATION PANEL
// ─────────────────────────────────────────────────────────────────────────────

function GamificationPanel({ trips }: { trips: any[] }) {
  const g = useMemo(() => computeGamification(trips), [trips]);
  const [showUnlock, setShowUnlock] = useState(false);
  const [prevCount, setPrevCount] = useState<number | null>(null);

  // Detect newly earned badge and show toast
  useEffect(() => {
    if (prevCount !== null && trips.length > prevCount) {
      const newBadge = ALL_BADGES.find(
        (b) => trips.length >= b.requiredTrips && prevCount < b.requiredTrips
      );
      if (newBadge) {
        setShowUnlock(true);
        setTimeout(() => setShowUnlock(false), 4000);
      }
    }
    setPrevCount(trips.length);
  }, [trips.length]);

  return (
    <div className="backdrop-blur-md rounded-3xl border border-purple-500/50 shadow-xl overflow-hidden mt-8">

      {/* ── Badge unlock toast ── */}
      {showUnlock && g.currentBadge && (
        <div className="fixed top-24 right-6 z-50 flex items-center gap-3 bg-gray-900 border border-yellow-400/50 rounded-2xl px-5 py-4 shadow-2xl shadow-yellow-400/20 animate-bounce">
          <span className="text-3xl">{g.currentBadge.emoji}</span>
          <div>
            <p className="text-yellow-300 font-bold text-sm">🎉 Badge Unlocked!</p>
            <p className="text-white text-xs">{g.currentBadge.name}</p>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-purple-900/60 via-pink-900/30 to-purple-900/60 px-8 py-6 border-b border-purple-500/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/40 text-xl">
            🏆
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Travel Achievements</h2>
            <p className="text-sm text-purple-300">Earn badges as you explore the world</p>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-8">

        {/* ── Current rank hero ── */}
        {g.currentBadge ? (
          <div className={`relative rounded-2xl border p-6 bg-gradient-to-br ${g.currentBadge.bg} ${g.currentBadge.borderColor} shadow-xl ${g.currentBadge.glow} overflow-hidden`}>
            {/* Background glow effect */}
            <div
              className="absolute inset-0 opacity-10 blur-3xl"
              style={{ background: `radial-gradient(circle at 30% 50%, ${g.currentBadge.color}, transparent 70%)` }}
            />

            <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Big badge emoji */}
              <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-5xl border ${g.currentBadge.borderColor} bg-black/30 shadow-lg ${g.currentBadge.glow} shrink-0`}>
                {g.currentBadge.emoji}
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                  <span className={`text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${g.currentBadge.borderColor} ${g.currentBadge.color} bg-black/30`}>
                    {g.currentBadge.tier.toUpperCase()}
                  </span>
                  <span className="text-gray-400 text-xs">Current Rank</span>
                </div>
                <h3 className={`text-3xl font-bold ${g.currentBadge.color} mb-1`}>
                  {g.currentBadge.name}
                </h3>
                <p className="text-gray-300 italic text-sm mb-3">"{g.currentBadge.tag}"</p>
                <p className="text-gray-400 text-sm max-w-md">{g.currentBadge.description}</p>

                {/* XP & trips strip */}
                <div className="flex flex-wrap gap-4 mt-4">
                  <div className="bg-black/30 rounded-xl px-4 py-2 border border-white/10">
                    <p className="text-gray-500 text-[10px] uppercase tracking-wider">Total XP</p>
                    <p className="text-yellow-300 font-bold font-mono text-lg">⚡ {g.totalXP}</p>
                  </div>
                  <div className="bg-black/30 rounded-xl px-4 py-2 border border-white/10">
                    <p className="text-gray-500 text-[10px] uppercase tracking-wider">Trips</p>
                    <p className="text-white font-bold font-mono text-lg">✈️ {g.tripCount}</p>
                  </div>
                  <div className="bg-black/30 rounded-xl px-4 py-2 border border-white/10">
                    <p className="text-gray-500 text-[10px] uppercase tracking-wider">Badges Earned</p>
                    <p className="text-purple-300 font-bold font-mono text-lg">🏅 {g.earned.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress to next badge */}
            {g.nextBadge && (
              <div className="mt-6 bg-black/30 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{g.nextBadge.emoji}</span>
                    <div>
                      <p className="text-white text-xl font-semibold">{g.nextBadge.name}</p>
                      <p className="text-gray-400 text-m">Next achievement</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-m font-bold ${g.nextBadge.color}`}>
                      {g.tripsToNext} trip{g.tripsToNext !== 1 ? "s" : ""} to go
                    </p>
                    <p className="text-gray-500 text-m">{Math.round(g.progressPct)}% complete</p>
                  </div>
                </div>
                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 relative overflow-hidden"
                    style={{
                      width: `${g.progressPct}%`,
                      background: `linear-gradient(90deg, ${g.currentBadge.color.replace("text-", "")} 0%, #a855f7 100%)`,
                    }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  </div>
                </div>
                <p className="text-gray-500 text-m mt-1.5 text-right">
                  {g.tripCount} / {g.nextBadge.requiredTrips} trips
                </p>
              </div>
            )}

            {/* Max rank message */}
            {!g.nextBadge && (
              <div className="mt-6 bg-yellow-400/10 rounded-xl p-4 border border-yellow-400/30 text-center">
                <p className="text-yellow-300 font-bold">👑 You've reached the highest rank!</p>
                <p className="text-gray-400 text-sm mt-1">You are a Travel Legend. The world bows to your wanderlust.</p>
              </div>
            )}
          </div>
        ) : (
          /* No trips yet */
          <div className="text-center bg-white/5 rounded-2xl border border-purple-500/20 p-10">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-white font-bold text-xl mb-2">No Badges Yet</h3>
            <p className="text-gray-400 mb-4">Plan and save your first trip to earn your <span className="text-amber-500 font-semibold">Rookie Traveller 🥉</span> badge!</p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all"
            >
              ✈️ Plan Your First Trip
            </Link>
          </div>
        )}

        {/* ── All Badges Grid ── */}
        <div>
          <h3 className="text-xl font-bold text-purple-300 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span>🏅</span> All Badges
            <span className="text-gray-500 font-normal normal-case tracking-normal text-m ml-1">
              — {g.earned.length} / {ALL_BADGES.length} unlocked
            </span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {ALL_BADGES.map((badge) => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                unlocked={g.earned.some((b) => b.id === badge.id)}
                isActive={g.currentBadge?.id === badge.id}
              />
            ))}
          </div>
        </div>

        {/* ── Achievement milestones timeline ── */}
        <div>
          <h3 className="text-xl font-bold text-purple-300 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span>📍</span> Journey Timeline
          </h3>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500/50 via-purple-500/20 to-transparent" />

            <div className="space-y-4 pl-14">
              {ALL_BADGES.map((badge, i) => {
                const unlocked = g.earned.some((b) => b.id === badge.id);
                const isActive = g.currentBadge?.id === badge.id;
                return (
                  <div key={badge.id} className="relative">
                    {/* Dot on timeline */}
                    <div
                      className={`absolute -left-[46px] w-8 h-8 rounded-full flex items-center justify-center text-base border-2 transition-all
                        ${unlocked
                          ? `${badge.borderColor} bg-black shadow-lg ${badge.glow}`
                          : "border-gray-700 bg-gray-900"
                        }
                        ${isActive ? "ring-2 ring-purple-500 ring-offset-1 ring-offset-black scale-110" : ""}
                      `}
                    >
                      {unlocked ? badge.emoji : "🔒"}
                    </div>

                    <div
                      className={`rounded-xl px-4 py-3 border transition-all
                        ${unlocked
                          ? `bg-gradient-to-r ${badge.bg} ${badge.borderColor}`
                          : "bg-white/3 border-white/5 opacity-50"
                        }
                      `}
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          <span className={`font-bold text-xl ${unlocked ? badge.color : "text-gray-500"}`}>
                            {badge.name}
                          </span>
                          <span className="text-gray-500 text-xs ml-2">— {badge.tag}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-s text-gray-500">
                            {badge.requiredTrips} trip{badge.requiredTrips > 1 ? "s" : ""}
                          </span>
                          <span className={`text-m font-mono ${unlocked ? "text-yellow-300" : "text-gray-600"}`}>
                            ⚡{badge.xp} XP
                          </span>
                          {unlocked && (
                            <span className="text-[12px] bg-green-500/20 text-green-300 border border-green-500/30 px-2 py-0.5 rounded-full font-semibold">
                              ✓ Earned
                            </span>
                          )}
                          {!unlocked && g.nextBadge?.id === badge.id && (
                            <span className={`text-[12px] px-2 py-0.5 rounded-full font-semibold border ${badge.borderColor} ${badge.color} bg-black/30`}>
                              Next up
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── XP Leaderboard hint ── */}
        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/20 rounded-2xl border border-purple-500/20 p-5 flex items-center gap-4">
          <span className="text-4xl shrink-0">⚡</span>
          <div>
            <p className="text-white font-bold text-xl">Your XP Score: <span className="text-yellow-300 font-mono">{g.totalXP}</span></p>
            <p className="text-gray-400 text-m mt-0.5">
              Each trip earns <span className="text-purple-300">120 XP</span> · Each unique destination earns <span className="text-purple-300">+30 bonus XP</span>. Keep exploring to climb the ranks!
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function parseCost(raw: string | undefined | null): number {
  if (!raw) return 0;
  const lower = raw.toLowerCase().trim();
  if (lower === "free" || lower === "₹0" || lower === "$0") return 0;
  const digits = raw.replace(/[^0-9.]/g, "");
  return digits ? parseFloat(digits) : 0;
}

function formatINR(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

function categorise(activity: string): string {
  const a = activity.toLowerCase();
  if (/hotel|stay|check.in|check.out|accommodation|hostel|resort/.test(a)) return "Accommodation";
  if (/train|bus|taxi|cab|auto|flight|transport|travel|transfer|airport|station|rickshaw/.test(a)) return "Transport";
  if (/lunch|dinner|breakfast|meal|food|eat|restaurant|café|cafe|snack|biryani|chai|tea|street food/.test(a)) return "Food & Dining";
  if (/temple|mosque|church|shrine|mandir|masjid|gurdwara|religious|prayer|worship/.test(a)) return "Religious";
  if (/museum|fort|palace|monument|historical|heritage|gallery|exhibit|ruins/.test(a)) return "Sightseeing";
  if (/trek|hike|adventure|rafting|paragliding|zip.?line|safari|wildlife|bungee/.test(a)) return "Adventure";
  if (/shop|market|bazaar|mall|souvenir|buy|purchase|bazar/.test(a)) return "Shopping";
  if (/spa|massage|yoga|wellness|relax|meditation/.test(a)) return "Wellness";
  if (/beach|lake|river|waterfall|garden|park|nature|hill|sunset|sunrise/.test(a)) return "Nature";
  if (/show|performance|concert|event|festival|entertainment|cinema/.test(a)) return "Entertainment";
  return "Miscellaneous";
}

const CATEGORY_COLORS: Record<string, string> = {
  Accommodation: "#ec4899",
  Transport: "#3b82f6",
  "Food & Dining": "#f59e0b",
  Religious: "#8b5cf6",
  Sightseeing: "#06b6d4",
  Adventure: "#f97316",
  Shopping: "#84cc16",
  Wellness: "#14b8a6",
  Nature: "#22c55e",
  Entertainment: "#e879f9",
  Miscellaneous: "#6b7280",
};

const CATEGORY_EMOJI: Record<string, string> = {
  Accommodation: "🏨",
  Transport: "🚆",
  "Food & Dining": "🍽️",
  Religious: "🛕",
  Sightseeing: "🏛️",
  Adventure: "🧗",
  Shopping: "🛍️",
  Wellness: "🧘",
  Nature: "🌿",
  Entertainment: "🎭",
  Miscellaneous: "🔹",
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPUTE STATS FOR A SINGLE TRIP
// ─────────────────────────────────────────────────────────────────────────────

function computeTripStats(trip: any) {
  const days = trip.itinerary?.days || [];
  const hotels = trip.hotels || [];
  const railways = trip.railways || [];

  const dailyData = days.map((day: any) => {
    const activities = (day.activities || []).map((a: any) => ({
      ...a,
      costNum: parseCost(a.cost),
      category: categorise(a.activity || ""),
    }));
    const total = activities.reduce((s: number, a: any) => s + a.costNum, 0);
    return { day: day.day, date: day.date, activities, total };
  });

  const transportCost = parseCost(trip.itinerary?.transport?.cost);
  const hotelCost = hotels.length > 0 ? parseCost(hotels[0].price) * Math.max(days.length, 1) : 0;
  const activitiesTotalCost = dailyData.reduce((s: number, d: any) => s + d.total, 0);
  const grandTotal = activitiesTotalCost + transportCost + hotelCost;
  const avgPerDay = dailyData.length > 0 ? activitiesTotalCost / dailyData.length : 0;

  const categoryMap: Record<string, number> = {};
  dailyData.forEach((d: any) =>
    d.activities.forEach((a: any) => {
      categoryMap[a.category] = (categoryMap[a.category] || 0) + a.costNum;
    })
  );
  if (transportCost > 0) categoryMap["Transport"] = (categoryMap["Transport"] || 0) + transportCost;
  if (hotelCost > 0) categoryMap["Accommodation"] = (categoryMap["Accommodation"] || 0) + hotelCost;

  const maxDay = dailyData.length > 0
    ? dailyData.reduce((b: any, d: any) => (d.total > b.total ? d : b), dailyData[0])
    : null;

  const totalActivities = dailyData.reduce((s: number, d: any) => s + d.activities.length, 0);
  const freeActivities = dailyData.reduce(
    (s: number, d: any) => s + d.activities.filter((a: any) => a.costNum === 0).length, 0
  );
  const totalHours = totalActivities * 1.5;

  return {
    dailyData,
    transportCost,
    hotelCost,
    activitiesTotalCost,
    grandTotal,
    avgPerDay,
    categoryMap,
    maxDay,
    totalActivities,
    freeActivities,
    totalHours,
    numDays: days.length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MINI CHARTS
// ─────────────────────────────────────────────────────────────────────────────

function MiniBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const maxIdx = data.findIndex((d) => d.value === max);
  return (
    <div className="w-full">
      <div className="flex items-end gap-1 h-20">
        {data.map((d, i) => {
          const pct = (d.value / max) * 100;
          const isMax = i === maxIdx;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div
                className="w-full rounded-t transition-all duration-700"
                style={{
                  height: `${Math.max(pct * 0.7, 3)}px`,
                  background: isMax
                    ? "linear-gradient(180deg,#ec4899,#a855f7)"
                    : "linear-gradient(180deg,#a855f799,#a855f755)",
                  boxShadow: isMax ? "0 0 8px #ec489966" : "none",
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 mt-1">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-[10px] text-gray-600">D{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniPieChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  if (total === 0) return <div className="text-gray-600 text-2xl text-center py-4">No data</div>;

  let cumAngle = 0;
  const paths = slices
    .filter((s) => s.value > 0)
    .map((sl) => {
      const frac = sl.value / total;
      const startAngle = cumAngle;
      cumAngle += frac * 360;
      const endAngle = cumAngle;
      const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
      const cx = 40, cy = 40, r = 36;
      const x1 = cx + r * Math.cos(toRad(startAngle));
      const y1 = cy + r * Math.sin(toRad(startAngle));
      const x2 = cx + r * Math.cos(toRad(endAngle));
      const y2 = cy + r * Math.sin(toRad(endAngle));
      const largeArc = frac > 0.5 ? 1 : 0;
      return {
        d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`,
        color: sl.color,
        label: sl.label,
        pct: Math.round(frac * 100),
        value: sl.value,
      };
    });

  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 80 80" className="w-20 h-20">
        {paths.map((p, i) => (
          <path key={i} d={p.d} fill={p.color} stroke="#0a0a0a" strokeWidth="0.8" />
        ))}
        <circle cx="40" cy="40" r="18" fill="#0a0a0a" />
        <text x="40" y="38" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">Total</text>
        <text x="40" y="47" textAnchor="middle" fill="#a855f7" fontSize="5">
          {formatINR(total)}
        </text>
      </svg>
      <div className="w-full space-y-1">
        {paths.slice(0, 4).map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 min-w-0">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
              <span className="text-[15px] text-gray-400 truncate">{p.label}</span>
            </div>
            <span className="text-[15px] text-gray-300 font-mono shrink-0">{p.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE TRIP COLUMN CARD
// ─────────────────────────────────────────────────────────────────────────────

function TripInsightCard({ trip, index, isHighestSpend }: { trip: any; index: number; isHighestSpend: boolean }) {
  const [tab, setTab] = useState<"overview" | "daily" | "categories">("overview");
  const stats = useMemo(() => computeTripStats(trip), [trip]);

  const barData = stats.dailyData.map((d: any) => ({ label: String(d.day), value: d.total }));
  const categorySlices = Object.entries(stats.categoryMap)
    .filter(([, v]) => (v as number) > 0)
    .map(([label, value]) => ({ label, value: value as number, color: CATEGORY_COLORS[label] || "#6b7280" }));

  const ACCENT_COLORS = [
    { border: "border-purple-500/50", glow: "shadow-purple-500/10", badge: "bg-purple-500/20 text-purple-300" },
    { border: "border-pink-500/50",   glow: "shadow-pink-500/10",   badge: "bg-pink-500/20 text-pink-300"   },
    { border: "border-cyan-500/50",   glow: "shadow-cyan-500/10",   badge: "bg-cyan-500/20 text-cyan-300"   },
    { border: "border-orange-500/50", glow: "shadow-orange-500/10", badge: "bg-orange-500/20 text-orange-300"},
    { border: "border-green-500/50",  glow: "shadow-green-500/10",  badge: "bg-green-500/20 text-green-300" },
  ];
  const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];

  return (
    <div className={`bg-gray-900/80 rounded-2xl border ${accent.border} shadow-xl ${accent.glow} flex flex-col overflow-hidden min-w-[280px]`}>
      {/* Card Header */}
      <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/30 px-5 py-4 border-b border-white/10">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <h3 className="text-white font-bold text-2xl truncate">{trip.destination}</h3>
            <p className="text-gray-400 text-s truncate">From {trip.startLocation}</p>
          </div>
          {isHighestSpend && (
            <span className="shrink-0 text-[10px] bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-2 py-0.5 rounded-full font-semibold">
              💸 Most Spent
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[12px] px-2 py-0.5 rounded-full font-medium ${accent.badge}`}>
            {trip.transport}
          </span>
          <span className="text-[12px] text-gray-500">{trip.startDate} → {trip.endDate}</span>
        </div>
      </div>

      {/* Grand Total Hero */}
      <div className="px-5 py-4 border-b border-white/5 bg-black/20">
        <p className="text-s text-gray-500 uppercase tracking-widest mb-1">Grand Total</p>
        <p className="text-2xl font-bold text-purple-300 font-mono">{formatINR(stats.grandTotal)}</p>
        <div className="flex gap-4 mt-2">
          <div>
            <p className="text-[15px] text-gray-500">Avg/Day</p>
            <p className="text-m font-semibold text-white font-mono">{formatINR(Math.round(stats.avgPerDay))}</p>
          </div>
          <div>
            <p className="text-[15px] text-gray-500">Days</p>
            <p className="text-m font-semibold text-white">{stats.numDays}</p>
          </div>
          <div>
            <p className="text-[15px] text-gray-500">Hours</p>
            <p className="text-m font-semibold text-white">~ {Math.round(stats.totalHours)}h</p>
          </div>
        </div>
      </div>

      {/* Mini Tabs */}
      <div className="flex border-b border-white/5">
        {(["overview", "daily", "categories"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-[13px] font-semibold uppercase tracking-wider transition-all ${
              tab === t
                ? "text-purple-300 border-b-2 border-purple-400 bg-purple-500/10"
                : "text-gray-600 hover:text-gray-400"
            }`}
          >
            {t === "overview" ? "Overview" : t === "daily" ? "Daily" : "Categories"}
          </button>
        ))}
      </div>

      <div className="p-4 flex-1">
        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div className="space-y-3">
            {/* Cost breakdown rows */}
            {[
              { label: "Activities", value: stats.activitiesTotalCost, color: "text-purple-400" },
              { label: "Transport", value: stats.transportCost, color: "text-blue-400" },
              { label: "Accommodation", value: stats.hotelCost, color: "text-pink-400" },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-gray-400 text-m">{row.label}</span>
                <span className={`text-m font-bold  ${row.color}`}>
                  {row.value > 0 ? formatINR(row.value) : "—"}
                </span>
              </div>
            ))}

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                { label: "Activities", value: stats.totalActivities, color: "text-white" },
                { label: "Free", value: stats.freeActivities, color: "text-green-400" },
                { label: "Highest Day", value: stats.maxDay ? `Day ${stats.maxDay.day}` : "—", color: "text-orange-400" },
                { label: "Peak Spend", value: stats.maxDay ? formatINR(stats.maxDay.total) : "—", color: "text-orange-400" },
              ].map((s, i) => (
                <div key={i} className="bg-white/5 rounded-lg p-2">
                  <p className="text-[15px] text-gray-500 mb-0.5">{s.label}</p>
                  <p className={`text-m font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Budget level badge */}
            <div className="flex items-center gap-2 bg-white/5 rounded-lg p-2 mt-1">
              <span className="text-m text-gray-400">Budget Level:</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                trip.budget === "High"
                  ? "bg-red-500/20 text-red-300"
                  : trip.budget === "Moderate"
                  ? "bg-yellow-500/20 text-yellow-300"
                  : "bg-green-500/20 text-green-300"
              }`}>
                {trip.budget}
              </span>
              <span className="text-s text-gray-500 ml-auto">{trip.travelers}</span>
            </div>
          </div>
        )}

        {/* ── DAILY ── */}
        {tab === "daily" && (
          <div className="space-y-3">
            {barData.length > 0 ? (
              <MiniBarChart data={barData} />
            ) : (
              <p className="text-gray-600 text-l text-center py-4">No daily data</p>
            )}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {stats.dailyData.map((day: any, i: number) => (
                <div key={i} className="bg-white/5 rounded-lg px-3 py-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white text-l font-semibold">Day {day.day}</span>
                    <span className="text-purple-300 text-l font-mono font-bold">{formatINR(day.total)}</span>
                  </div>
                  <div className="text-[13px] text-gray-500">{day.date} · {day.activities.length} activities · ~{day.activities.length * 1.5}h</div>
                  {/* Inline spend bar */}
                  {stats.activitiesTotalCost > 0 && (
                    <div className="w-full bg-white/5 rounded-full h-1 mt-1.5">
                      <div
                        className="h-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                        style={{ width: `${(day.total / stats.activitiesTotalCost) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CATEGORIES ── */}
        {tab === "categories" && (
          <div className="space-y-3">
            <MiniPieChart slices={categorySlices} />
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {Object.entries(stats.categoryMap)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([cat, val], i) => {
                  const pct = stats.grandTotal > 0 ? ((val as number) / stats.grandTotal) * 100 : 0;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-[15px] mb-0.5">
                        <span className="text-gray-400 flex items-center gap-1">
                          {CATEGORY_EMOJI[cat] || "🔹"} {cat}
                        </span>
                        <span className="text-white">{formatINR(val as number)}</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full"
                          style={{ width: `${pct}%`, background: CATEGORY_COLORS[cat] || "#a855f7" }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ALL TRIPS INSIGHTS SECTION
// ─────────────────────────────────────────────────────────────────────────────

function AllTripsInsights({ trips }: { trips: any[] }) {
  const tripsWithData = trips.filter((t) => t.itinerary?.days?.length > 0);

  // Aggregate stats across all trips
  const aggregate = useMemo(() => {
    if (tripsWithData.length === 0) return null;
    const allStats = tripsWithData.map((t) => computeTripStats(t));
    const totalSpend = allStats.reduce((s, st) => s + st.grandTotal, 0);
    const totalDays = allStats.reduce((s, st) => s + st.numDays, 0);
    const totalActivities = allStats.reduce((s, st) => s + st.totalActivities, 0);
    const totalHours = allStats.reduce((s, st) => s + st.totalHours, 0);
    const avgTripCost = totalSpend / allStats.length;
    const highestTrip = allStats.reduce((b, st, i) =>
      st.grandTotal > b.stat.grandTotal ? { stat: st, idx: i } : b,
      { stat: allStats[0], idx: 0 }
    );

    // Merge category maps
    const mergedCategories: Record<string, number> = {};
    allStats.forEach((st) => {
      Object.entries(st.categoryMap).forEach(([k, v]) => {
        mergedCategories[k] = (mergedCategories[k] || 0) + (v as number);
      });
    });

    return { totalSpend, totalDays, totalActivities, totalHours, avgTripCost, highestTrip, mergedCategories, allStats };
  }, [tripsWithData]);

  if (tripsWithData.length === 0) {
    return (
      <div className="backdrop-blur-md rounded-3xl border border-purple-500/50 p-8 shadow-xl mt-8">
        <h2 className="text-2xl font-bold text-purple-400 mb-4 flex items-center gap-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Trip Insights
        </h2>
        <p className="text-gray-500 text-center py-8">No detailed trip data available yet. Generate and save a trip to see insights.</p>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-md rounded-3xl border border-purple-500/50 shadow-xl mt-8 overflow-hidden">
      {/* Section Header */}
      <div className="bg-gradient-to-r from-purple-900/60 via-pink-900/30 to-purple-900/60 px-8 py-6 border-b border-purple-500/30">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/40">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Trip Insights & Analytics</h2>
            <p className="text-s text-purple-300">{tripsWithData.length} trips analysed · All budgets combined</p>
          </div>
        </div>
      </div>

      {/* Aggregate KPI Strip */}
      {aggregate && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-purple-500/10 border-b border-purple-500/20">
          {[
            { icon: "💰", label: "Total Spent", value: formatINR(aggregate.totalSpend), sub: "across all trips", accent: "text-purple-300" },
            { icon: "✈️", label: "Trips Taken", value: tripsWithData.length, sub: "with itinerary data", accent: "text-pink-300" },
            { icon: "📅", label: "Total Days", value: aggregate.totalDays, sub: "travel days", accent: "text-cyan-300" },
            { icon: "🎯", label: "Activities", value: aggregate.totalActivities, sub: "across all trips", accent: "text-orange-300" },
            { icon: "📊", label: "Avg Trip Cost", value: formatINR(Math.round(aggregate.avgTripCost)), sub: "per trip", accent: "text-green-300" },
          ].map((k, i) => (
            <div key={i} className="bg-black/30 px-5 py-4">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm">{k.icon}</span>
                <span className="text-[15px] text-gray-500 uppercase tracking-widest">{k.label}</span>
              </div>
              <div className={`text-2xl font-bold ${k.accent}`}> {k.value}</div>
              <div className="text-[15px] text-gray-600 mt-0.5">{k.sub}</div>
            </div>
          ))}
        </div>
      )}

      <div className="p-6 md:p-8">
        {/* ── Top category spend (aggregate) ── */}
        {aggregate && (
          <div className="mb-8 bg-white/5 rounded-2xl border border-purple-500/20 p-5">
            <h3 className="text-xl font-bold text-purple-300 uppercase tracking-widest mb-4">
              🏷️ Overall Spend by Category — All Trips Combined
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(aggregate.mergedCategories)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([cat, val], i) => {
                  const pct = aggregate.totalSpend > 0 ? ((val as number) / aggregate.totalSpend) * 100 : 0;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-[15px] mb-1">
                        <span className="text-gray-300 flex items-center gap-1.5">
                          <span>{CATEGORY_EMOJI[cat] || "🔹"}</span>{cat}
                        </span>
                        <span className="text-white ">
                          {formatINR(val as number)}
                          <span className="text-gray-500 ml-1">({pct.toFixed(1)}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{ width: `${pct}%`, background: CATEGORY_COLORS[cat] || "#a855f7" }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ── Per-Trip Comparison Header ── */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-purple-300 flex items-center gap-2">
            📋 Per-Trip Breakdown
            <span className="text-xs text-gray-500 font-normal">— scroll horizontally to see all trips</span>
          </h3>
          <span className="text-xs text-gray-600 bg-white/5 px-3 py-1 rounded-full border border-white/10">
            {tripsWithData.length} trip{tripsWithData.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* ── Per-Trip Column Cards (horizontal scroll) ── */}
        <div className="overflow-x-auto pb-4">
          <div
            className="flex gap-4"
            style={{ minWidth: `${tripsWithData.length * 296}px` }}
          >
            {tripsWithData.map((trip, i) => {
              const tripStats = computeTripStats(trip);
              const isHighest = aggregate
                ? tripStats.grandTotal === aggregate.totalSpend / 1 &&
                  aggregate.highestTrip.idx === i
                : false;
              const highestIdx = aggregate?.highestTrip.idx ?? -1;
              return (
                <div key={trip.id} style={{ width: "280px", flexShrink: 0 }}>
                  <TripInsightCard 
                    trip={trip}
                    index={i}
                    isHighestSpend={highestIdx === i}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Comparison Table (all trips side by side) ── */}
        <div className="mt-8 bg-white/5 rounded-2xl border border-purple-500/20 overflow-hidden">
          <div className="px-5 py-3 border-b border-purple-500/20 bg-purple-500/10">
            <h3 className="text-xl font-bold text-purple-300 uppercase tracking-widest">
              📊 Side-by-Side Comparison Table
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-l">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-gray-500 uppercase tracking-wider font-semibold sticky left-0 bg-gray-900/95 z-10 min-w-[140px]">
                    Metric
                  </th>
                  {tripsWithData.map((trip, i) => (
                    <th key={i} className="px-4 py-3 text-center text-purple-300 font-bold min-w-[140px]">
                      <div className="truncate max-w-[120px] mx-auto">{trip.destination}</div>
                      <div className="text-gray-600 font-normal text-[10px]">{trip.startDate}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    label: "Grand Total",
                    fn: (s: ReturnType<typeof computeTripStats>) => formatINR(s.grandTotal),
                    highlight: true,
                    best: (vals: number[]) => Math.max(...vals),
                    valueOf: (s: ReturnType<typeof computeTripStats>) => s.grandTotal,
                  },
                  {
                    label: "Activities Spend",
                    fn: (s: ReturnType<typeof computeTripStats>) => formatINR(s.activitiesTotalCost),
                    valueOf: (s: ReturnType<typeof computeTripStats>) => s.activitiesTotalCost,
                  },
                  {
                    label: "Transport Cost",
                    fn: (s: ReturnType<typeof computeTripStats>) => s.transportCost > 0 ? formatINR(s.transportCost) : "—",
                    valueOf: (s: ReturnType<typeof computeTripStats>) => s.transportCost,
                  },
                  {
                    label: "Accommodation",
                    fn: (s: ReturnType<typeof computeTripStats>) => s.hotelCost > 0 ? formatINR(s.hotelCost) : "—",
                    valueOf: (s: ReturnType<typeof computeTripStats>) => s.hotelCost,
                  },
                  {
                    label: "Avg / Day",
                    fn: (s: ReturnType<typeof computeTripStats>) => formatINR(Math.round(s.avgPerDay)),
                    valueOf: (s: ReturnType<typeof computeTripStats>) => s.avgPerDay,
                  },
                  {
                    label: "Trip Duration",
                    fn: (s: ReturnType<typeof computeTripStats>) => `${s.numDays} days`,
                    valueOf: (s: ReturnType<typeof computeTripStats>) => s.numDays,
                  },
                  {
                    label: "Total Activities",
                    fn: (s: ReturnType<typeof computeTripStats>) => String(s.totalActivities),
                    valueOf: (s: ReturnType<typeof computeTripStats>) => s.totalActivities,
                  },
                  {
                    label: "Free Activities",
                    fn: (s: ReturnType<typeof computeTripStats>) => String(s.freeActivities),
                    valueOf: (s: ReturnType<typeof computeTripStats>) => s.freeActivities,
                    bestIsMax: false,
                  },
                  {
                    label: "Hours Planned",
                    fn: (s: ReturnType<typeof computeTripStats>) => `~${Math.round(s.totalHours)}h`,
                    valueOf: (s: ReturnType<typeof computeTripStats>) => s.totalHours,
                  },
                  {
                    label: "Peak Day Spend",
                    fn: (s: ReturnType<typeof computeTripStats>) => s.maxDay ? formatINR(s.maxDay.total) : "—",
                    valueOf: (s: ReturnType<typeof computeTripStats>) => s.maxDay?.total || 0,
                  },
                ].map((row, ri) => {
                  const allStats = tripsWithData.map((t) => computeTripStats(t));
                  const values = allStats.map((s) => row.valueOf(s));
                  const maxVal = Math.max(...values);
                  const minVal = Math.min(...values.filter((v) => v > 0));

                  return (
                    <tr key={ri} className={`border-b border-white/5 hover:bg-white/5 ${ri % 2 === 0 ? "bg-black/10" : ""}`}>
                      <td className={`px-4 py-3 font-semibold sticky left-0 z-10 ${ri % 2 === 0 ? "bg-gray-900/95" : "bg-gray-900/90"} ${row.highlight ? "text-purple-300" : "text-gray-400"}`}>
                        {row.label}
                      </td>
                      {allStats.map((s, si) => {
                        const val = row.valueOf(s);
                        const isMax = val === maxVal && val > 0;
                        const isMin = val === minVal && val > 0 && val !== maxVal;
                        return (
                          <td key={si} className="px-4 py-3 text-center">
                            <span className={`font-mono font-semibold ${
                              row.highlight && isMax
                                ? "text-red-400"
                                : row.highlight && isMin
                                ? "text-green-400"
                                : isMax
                                ? "text-orange-400"
                                : "text-white"
                            }`}>
                              {row.fn(s)}
                            </span>
                            {isMax && row.highlight && (
                              <span className="block text-[9px] text-red-400/70 mt-0.5">highest</span>
                            )}
                            {isMin && row.highlight && (
                              <span className="block text-[9px] text-green-400/70 mt-0.5">lowest</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Compute current badge for profile card
  const gamification = useMemo(() => computeGamification(trips), [trips]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    if (session) fetchTrips();
  }, [session]);

  const fetchTrips = async () => {
    try {
      const response = await fetch("/api/trips");
      const data = await response.json();
      if (data.success) setTrips(data.trips);
    } catch (error) {
      console.error("Failed to fetch trips:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTrip = async (tripId: string) => {
    if (!confirm("Are you sure you want to delete this trip?")) return;
    setDeleting(tripId);
    try {
      const response = await fetch(`/api/trips/delete?id=${tripId}`, { method: "DELETE" });
      const data = await response.json();
      if (data.success) {
        setTrips(trips.filter((trip) => trip.id !== tripId));
        if (selectedTrip?.id === tripId) closeTripModal();
        alert("Trip deleted successfully!");
      } else {
        alert("Failed to delete trip: " + data.error);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete trip");
    } finally {
      setDeleting(null);
    }
  };

  const openTripModal = (trip: any) => { setSelectedTrip(trip); setModalOpen(true); };
  const closeTripModal = () => { setModalOpen(false); setTimeout(() => setSelectedTrip(null), 300); };

  if (status === "loading") {
    return <div > <Loader/> </div>;
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-20 pt-32">
      <div className="max-w-6xl mx-auto">

        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex cursor-pointer items-center gap-2 text-purple-400 hover:text-purple-300 mb-8 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>

        {/* ── Profile Card — now with active badge ── */}
        <div className="backdrop-blur-md rounded-3xl border border-purple-500/50 p-8 shadow-xl mb-8 overflow-hidden relative">
          {/* Subtle badge glow behind card */}
          {gamification.currentBadge && (
            <div
              className="absolute inset-0 opacity-5 pointer-events-none"
              style={{ background: `radial-gradient(circle at 10% 50%, ${gamification.currentBadge.color.replace("text-", "")}, transparent 60%)` }}
            />
          )}

          <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar with badge ring */}
            <div className="relative shrink-0">
              <img
                src={session?.user?.image || "/default-avatar.png"}
                alt="Profile"
                className={`w-24 h-24 rounded-full border-4 ${gamification.currentBadge ? gamification.currentBadge.borderColor : "border-purple-500"}`}
              />
              {/* Badge emoji floating over avatar */}
              {gamification.currentBadge && (
                <div className={`absolute -bottom-2 -right-2 w-9 h-9 rounded-full border-2 ${gamification.currentBadge.borderColor} bg-black flex items-center justify-center text-lg shadow-lg`}>
                  {gamification.currentBadge.emoji}
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-white mb-1">{session?.user?.name}</h1>
              <p className="text-gray-400 mb-3">{session?.user?.email}</p>

              {/* Active badge tag */}
              {gamification.currentBadge ? (
                <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start mb-3">
                  <span className={`text-sm font-bold px-3 py-1 rounded-full border ${gamification.currentBadge.borderColor} ${gamification.currentBadge.color} bg-black/40`}>
                    {gamification.currentBadge.emoji} {gamification.currentBadge.name}
                  </span>
                  <span className="text-s text-gray-500 italic">"{gamification.currentBadge.tag}"</span>
                </div>
              ) : (
                <p className="text-gray-500 text-sm mb-3 italic">Plan your first trip to earn a badge!</p>
              )}

              {/* Stats row */}
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <span className="bg-purple-500/20 text-purple-300 px-4 py-1.5 rounded-lg text-sm font-semibold">
                  ✈️ {trips.length} Trips
                </span>
                <span className="bg-yellow-500/10 text-yellow-300 px-4 py-1.5 rounded-lg text-sm font-semibold border border-yellow-500/20">
                  ⚡ {gamification.totalXP} XP
                </span>
                <span className="bg-white/5 text-gray-300 px-4 py-1.5 rounded-lg text-sm font-semibold border border-white/10">
                  🏅 {gamification.earned.length} / {ALL_BADGES.length} Badges
                </span>
              </div>

              {/* Mini XP progress bar */}
              {gamification.nextBadge && gamification.currentBadge && (
                <div className="mt-4 max-w-sm mx-auto md:mx-0">
                  <div className="flex justify-between text-s text-gray-500 mb-1">
                    <span>{gamification.currentBadge.name}</span>
                    <span>{gamification.nextBadge.name} ({gamification.tripsToNext} trips away)</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000"
                      style={{ width: `${gamification.progressPct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>


        {/* Trip History */}
        <div className="backdrop-blur-md rounded-3xl border border-purple-500/50 p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-purple-400 mb-6">Trip History</h2>

          {loading ? (
            <div className="text-center text-gray-400 py-12">Loading trips...</div>
          ) : trips.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p>No trips saved yet</p>
              <Link
                href="/dashboard"
                className="inline-block mt-4 px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all"
              >
                Plan Your First Trip
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  className="bg-white/5 rounded-xl p-6 border border-purple-500/30 hover:border-purple-500/60 transition-all relative"
                >
                  {/* Delete Button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteTrip(trip.id); }}
                    disabled={deleting === trip.id}
                    className="absolute top-5 right-4 p-2 cursor-pointer bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete trip"
                  >
                    {deleting === trip.id ? (
                      <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>

                  <div className="flex items-start justify-between mb-4 pr-8">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{trip.destination}</h3>
                      <p className="text-sm text-gray-400">From {trip.startLocation}</p>
                    </div>
                    <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-lg text-sm">
                      {trip.transport}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2 text-gray-300">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {trip.startDate} to {trip.endDate}
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {trip.travelers}
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {trip.budget} Budget
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mb-4">
                    Saved on {new Date(trip.createdAt).toLocaleDateString()}
                  </p>

                  <button
                    onClick={() => openTripModal(trip)}
                    className="cursor-pointer w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── GAMIFICATION PANEL ── */}
        {!loading && <GamificationPanel trips={trips} />}


        {/* ── ALL TRIPS INSIGHTS (below trip history) ── */}
        {!loading && trips.length > 0 && (
          <AllTripsInsights trips={trips} />
        )}

      </div>

      {/* Trip Details Modal */}
      {modalOpen && selectedTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeTripModal} />
          <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 rounded-2xl border border-purple-500/50 shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-t-2xl flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedTrip.destination}</h2>
                <p className="text-purple-100">From {selectedTrip.startLocation}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => deleteTrip(selectedTrip.id)}
                  disabled={deleting === selectedTrip.id}
                  className="p-2 bg-red-500/20 cursor-pointer hover:bg-red-500/30 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deleting === selectedTrip.id ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
                <button onClick={closeTripModal} className="cursor-pointer p-2 hover:bg-white/20 rounded-lg transition-colors">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Trip Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Dates", value: `${selectedTrip.startDate} to ${selectedTrip.endDate}` },
                  { label: "Travelers", value: selectedTrip.travelers },
                  { label: "Budget", value: selectedTrip.budget },
                  { label: "Transport", value: selectedTrip.transport },
                ].map((s, i) => (
                  <div key={i} className="bg-purple-500/10 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">{s.label}</p>
                    <p className="text-white font-semibold">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Transport Details */}
              {selectedTrip.itinerary?.transport && (
                <div className="bg-white/5 rounded-xl p-6 border border-purple-500/30">
                  <h3 className="text-xl font-bold text-purple-300 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Transport Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-gray-400">Duration</p><p className="text-white font-semibold">{selectedTrip.itinerary.transport.duration}</p></div>
                    <div><p className="text-gray-400">Cost</p><p className="text-green-400 font-semibold">{selectedTrip.itinerary.transport.cost}</p></div>
                    <div><p className="text-gray-400">Departure</p><p className="text-white font-semibold">{selectedTrip.itinerary.transport.departureTime}</p></div>
                    <div><p className="text-gray-400">Arrival</p><p className="text-white font-semibold">{selectedTrip.itinerary.transport.arrivalTime}</p></div>
                  </div>
                </div>
              )}

              {/* Hotels */}
              {selectedTrip.hotels && selectedTrip.hotels.length > 0 && (
                <div className="bg-white/5 rounded-xl p-6 border border-purple-500/30">
                  <h3 className="text-xl font-bold text-purple-300 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Hotels
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedTrip.hotels.map((hotel: any, idx: number) => (
                      <div key={idx} className="bg-purple-500/10 rounded-lg p-4">
                        <h4 className="text-white font-semibold mb-2">{hotel.name}</h4>
                        <p className="text-green-400 font-bold mb-1">{hotel.price}</p>
                        <p className="text-gray-400 text-sm">{hotel.address}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-white text-sm">{hotel.rating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Railways */}
              {selectedTrip.railways && selectedTrip.railways.length > 0 && (
                <div className="bg-white/5 rounded-xl p-6 border border-purple-500/30">
                  <h3 className="text-xl font-bold text-purple-300 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    Railway Options
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedTrip.railways.map((train: any, idx: number) => (
                      <div key={idx} className="bg-purple-500/10 rounded-lg p-4">
                        <h4 className="text-white font-semibold mb-1">{train.trainName}</h4>
                        <p className="text-gray-400 text-sm mb-3">#{train.trainNumber}</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between"><span className="text-gray-400">Class:</span><span className="text-white">{train.class}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">Duration:</span><span className="text-white">{train.duration}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">Price:</span><span className="text-green-400 font-semibold">{train.price}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Daily Itinerary */}
              {selectedTrip.itinerary?.days && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-purple-300 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Daily Itinerary ({selectedTrip.itinerary.days.length} Days)
                  </h3>
                  {selectedTrip.itinerary.days.map((day: any) => (
                    <div key={day.day} className="bg-white/5 rounded-xl p-4 border border-purple-500/30">
                      <h4 className="text-lg font-bold text-white mb-3">Day {day.day} - {day.date}</h4>
                      <div className="space-y-2">
                        {day.activities.map((activity: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-3 p-2 bg-purple-500/5 rounded-lg text-sm">
                            <span className="text-purple-400 font-semibold min-w-[70px]">{activity.time}</span>
                            <span className="flex-1 text-white">{activity.activity}</span>
                            <span className="text-green-400 font-semibold">{activity.cost}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-900 border-t border-purple-500/30 p-4 rounded-b-2xl">
              <button
                onClick={closeTripModal}
                className="cursor-pointer w-full py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}