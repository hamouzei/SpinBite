"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { RESTAURANT_ID } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";
import { BarChart3, Users, Gift, Zap, TrendingUp } from "lucide-react";

interface DashboardMetrics {
  totalSpins: number;
  todaySpins: number;
  totalCustomers: number;
  rewardsClaimed: number;
  topReward: string;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalSpins: 0, todaySpins: 0, totalCustomers: 0, rewardsClaimed: 0, topReward: "—",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const today = new Date().toISOString().split("T")[0];

        const [spinsRes, todaySpinsRes, customersRes, claimsRes] = await Promise.all([
          supabase.from("spins").select("id", { count: "exact", head: true }).eq("restaurant_id", RESTAURANT_ID),
          supabase.from("spins").select("id", { count: "exact", head: true }).eq("restaurant_id", RESTAURANT_ID).gte("created_at", today),
          supabase.from("customers").select("id", { count: "exact", head: true }).eq("restaurant_id", RESTAURANT_ID),
          supabase.from("claims").select("id", { count: "exact", head: true }).eq("claimed", true),
        ]);

        // Top reward
        const { data: topPrize } = await supabase
          .from("spins").select("prize_id, prizes(title)")
          .eq("restaurant_id", RESTAURANT_ID)
          .not("prize_id", "is", null)
          .limit(100);

        let topReward = "—";
        if (topPrize && topPrize.length > 0) {
          const counts: Record<string, { count: number; title: string }> = {};
          topPrize.forEach((s: { prize_id: string; prizes: { title: string }[] | null }) => {
            const pid = s.prize_id;
            const prizeData = s.prizes;
            if (pid && prizeData && prizeData.length > 0) {
              if (!counts[pid]) counts[pid] = { count: 0, title: prizeData[0].title };
              counts[pid].count++;
            }
          });
          const sorted = Object.values(counts).sort((a, b) => b.count - a.count);
          if (sorted.length > 0) topReward = sorted[0].title;
        }

        setMetrics({
          totalSpins: spinsRes.count || 0,
          todaySpins: todaySpinsRes.count || 0,
          totalCustomers: customersRes.count || 0,
          rewardsClaimed: claimsRes.count || 0,
          topReward,
        });
      } catch (err) {
        console.error("Failed to fetch metrics:", err);
      }
      setLoading(false);
    }
    fetchMetrics();
  }, []);

  const cards = [
    { label: "Total Spins", value: formatNumber(metrics.totalSpins), icon: BarChart3, color: "var(--accent-primary)" },
    { label: "Today's Spins", value: formatNumber(metrics.todaySpins), icon: Zap, color: "var(--accent-secondary)" },
    { label: "Total Customers", value: formatNumber(metrics.totalCustomers), icon: Users, color: "var(--success)" },
    { label: "Rewards Claimed", value: formatNumber(metrics.rewardsClaimed), icon: Gift, color: "var(--accent-glow)" },
    { label: "Top Reward", value: metrics.topReward, icon: TrendingUp, color: "var(--accent-primary)" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: "'Satoshi', sans-serif" }}>
          Dashboard
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Overview of your restaurant&apos;s performance</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card rounded-2xl h-32 animate-pulse bg-[var(--bg-surface)]" />
          ))}
        </div>
      ) : (
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
          variants={container} initial="hidden" animate="show">
          {cards.map((card, i) => (
            <motion.div key={i} variants={item}
              className="card rounded-2xl p-5 group hover:border-[var(--border-accent)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${card.color}15` }}>
                  <card.icon size={20} style={{ color: card.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold" style={{ fontFamily: "'Satoshi', sans-serif" }}>{card.value}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">{card.label}</p>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Recent activity placeholder */}
      <div className="mt-8">
        <h2 className="text-lg font-bold mb-4" style={{ fontFamily: "'Satoshi', sans-serif" }}>
          Recent Activity
        </h2>
        <div className="card rounded-2xl p-6">
          <p className="text-sm text-[var(--text-tertiary)] text-center py-8">
            Spin activity will appear here once customers start playing 🎰
          </p>
        </div>
      </div>
    </div>
  );
}
