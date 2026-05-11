"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { RESTAURANT_ID } from "@/lib/constants";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from "recharts";

interface SpinsByDay { date: string; count: number; }
interface TopPrize { name: string; count: number; }

const COLORS = ["#FF6B00", "#FFB800", "#FF8A00", "#22C55E", "#3B82F6", "#A855F7"];

export default function AnalyticsPage() {
  const [spinsByDay, setSpinsByDay] = useState<SpinsByDay[]>([]);
  const [topPrizes, setTopPrizes] = useState<TopPrize[]>([]);
  const [claimRate, setClaimRate] = useState({ claimed: 0, unclaimed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        // Spins by day (last 14 days)
        const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
        const { data: spins } = await supabase
          .from("spins").select("created_at")
          .eq("restaurant_id", RESTAURANT_ID)
          .gte("created_at", twoWeeksAgo)
          .order("created_at");

        if (spins) {
          const byDay: Record<string, number> = {};
          spins.forEach((s) => {
            const day = s.created_at.split("T")[0];
            byDay[day] = (byDay[day] || 0) + 1;
          });
          setSpinsByDay(Object.entries(byDay).map(([date, count]) => ({
            date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            count,
          })));
        }

        // Top prizes
        const { data: prizeSpins } = await supabase
          .from("spins").select("prize_id, prizes(title)")
          .eq("restaurant_id", RESTAURANT_ID)
          .not("prize_id", "is", null)
          .limit(500);

        if (prizeSpins) {
          const counts: Record<string, { name: string; count: number }> = {};
          prizeSpins.forEach((s: { prize_id: string; prizes: { title: string }[] | null }) => {
            const pid = s.prize_id;
            const prizeData = s.prizes;
            if (pid && prizeData && prizeData.length > 0) {
              if (!counts[pid]) counts[pid] = { name: prizeData[0].title, count: 0 };
              counts[pid].count++;
            }
          });
          setTopPrizes(Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 6));
        }

        // Claim rate
        const { count: totalClaims } = await supabase.from("claims").select("id", { count: "exact", head: true });
        const { count: claimedClaims } = await supabase.from("claims").select("id", { count: "exact", head: true }).eq("claimed", true);
        const total = totalClaims || 0;
        const claimed = claimedClaims || 0;
        setClaimRate({ claimed, unclaimed: total - claimed });
      } catch (err) {
        console.error("Analytics error:", err);
      }
      setLoading(false);
    }
    fetchAnalytics();
  }, []);

  const claimPieData = [
    { name: "Claimed", value: claimRate.claimed },
    { name: "Unclaimed", value: claimRate.unclaimed },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: "'Satoshi', sans-serif" }}>Analytics</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Track engagement and performance</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card rounded-2xl h-72 animate-pulse" />
          ))}
        </div>
      ) : (
        <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>

          {/* Spins over time */}
          <div className="card rounded-2xl p-6 lg:col-span-2">
            <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Spins Over Time (14 days)</h3>
            {spinsByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={spinsByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: "#71717A", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#71717A", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "#13131A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, fontSize: 12 }}
                    labelStyle={{ color: "#A1A1AA" }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#FF6B00" strokeWidth={2} dot={{ fill: "#FF6B00", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-[var(--text-tertiary)] text-center py-16">No spin data yet</p>
            )}
          </div>

          {/* Top prizes */}
          <div className="card rounded-2xl p-6">
            <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Top Prizes</h3>
            {topPrizes.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topPrizes} layout="vertical">
                  <XAxis type="number" tick={{ fill: "#71717A", fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: "#A1A1AA", fontSize: 11 }} width={100} />
                  <Tooltip
                    contentStyle={{ background: "#13131A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, fontSize: 12 }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {topPrizes.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-[var(--text-tertiary)] text-center py-16">No data yet</p>
            )}
          </div>

          {/* Claim rate */}
          <div className="card rounded-2xl p-6">
            <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Claim Rate</h3>
            {claimRate.claimed + claimRate.unclaimed > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={claimPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                    paddingAngle={4} dataKey="value">
                    <Cell fill="#22C55E" />
                    <Cell fill="#71717A" />
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#13131A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-[var(--text-tertiary)] text-center py-16">No claims yet</p>
            )}
            <div className="flex justify-center gap-6 mt-2 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[var(--success)]" />Claimed</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[var(--text-tertiary)]" />Unclaimed</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
