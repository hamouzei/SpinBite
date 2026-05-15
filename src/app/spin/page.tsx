"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { RESTAURANT_ID, MAX_DAILY_SPINS } from "@/lib/constants";
import type { Prize, SpinResult } from "@/types/database";
import SpinWheel from "@/components/wheel/SpinWheel";
import RewardModal from "@/components/wheel/RewardModal";
import FloatingParticles from "@/components/particles/FloatingParticles";
import { generateClaimCode } from "@/lib/utils";
import { initAudio, playClickSound } from "@/lib/audio";

export default function SpinPage() {
  const router = useRouter();
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [spinResult, setSpinResult] = useState<SpinResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [spinsRemaining, setSpinsRemaining] = useState(MAX_DAILY_SPINS);
  const [customerName, setCustomerName] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Check auth on mount
  useEffect(() => {
    const custId = localStorage.getItem("spinbite_customer_id");
    const custName = localStorage.getItem("spinbite_customer_name");
    const remaining = localStorage.getItem("spinbite_spins_remaining");

    if (!custId) {
      router.push("/register");
      return;
    }
    setCustomerName(custName || "Player");
    setSpinsRemaining(remaining ? parseInt(remaining) : MAX_DAILY_SPINS);
  }, [router]);

  // Fetch prizes
  useEffect(() => {
    async function fetchPrizes() {
      const { data } = await supabase
        .from("prizes")
        .select("*")
        .eq("restaurant_id", RESTAURANT_ID)
        .eq("active", true)
        .eq("deleted", false);

      if (data && data.length > 0) {
        setPrizes(data);
      } else {
        // Demo prizes if none exist
        setPrizes(getDemoPrizes());
      }
      setLoading(false);
    }
    fetchPrizes();
  }, []);

  // Weighted random selection (server-side in production)
  const calculateWinner = useCallback((availablePrizes: Prize[]): number => {
    const total = availablePrizes.reduce((sum, p) => sum + p.probability, 0);
    let random = Math.random() * total;
    for (let i = 0; i < availablePrizes.length; i++) {
      random -= availablePrizes[i].probability;
      if (random <= 0) return i;
    }
    return 0;
  }, []);

  const handleSpin = useCallback(async () => {
    if (spinning || spinsRemaining <= 0 || prizes.length === 0) return;

    // Initialize audio on first user gesture (required for mobile)
    initAudio();
    playClickSound();

    setError(null);
    setSpinning(true);

    try {
      const winnerIndex = calculateWinner(prizes);
      const wonPrize = prizes[winnerIndex];
      const claimCode = generateClaimCode();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      // Record spin in DB
      const customerId = localStorage.getItem("spinbite_customer_id");
      if (customerId) {
        const { data: spinRecord } = await supabase
          .from("spins")
          .insert({
            customer_id: customerId,
            restaurant_id: RESTAURANT_ID,
            prize_id: wonPrize.id,
            spin_number: MAX_DAILY_SPINS - spinsRemaining + 1,
          })
          .select().single();

        if (spinRecord) {
          await supabase.from("claims").insert({
            spin_id: spinRecord.id,
            claim_code: claimCode,
            claimed: false,
            expires_at: expiresAt,
          });
        }

        // Update customer spin count
        const today = new Date().toISOString().split("T")[0];
        await supabase
          .from("customers")
          .update({ spins_today: MAX_DAILY_SPINS - spinsRemaining + 1, last_spin_date: today })
          .eq("id", customerId);
      }

      const newRemaining = spinsRemaining - 1;

      setSpinResult({
        prize_id: wonPrize.id,
        prize_title: wonPrize.title,
        image_url: wonPrize.image_url,
        claim_code: claimCode,
        expires_at: expiresAt,
        spins_remaining: newRemaining,
      });
      setTargetIndex(winnerIndex);
      setSpinsRemaining(newRemaining);
      localStorage.setItem("spinbite_spins_remaining", String(newRemaining));
    } catch (err) {
      console.error("Spin error:", err);
      setError("Something went wrong. Please try again.");
      setSpinning(false);
    }
  }, [spinning, spinsRemaining, prizes, calculateWinner]);

  const handleSpinComplete = useCallback(() => {
    setSpinning(false);
    setTargetIndex(null);
    setShowModal(true);
  }, []);

  const handleSpinAgain = useCallback(() => {
    setShowModal(false);
    setSpinResult(null);
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Loading wheel...</p>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-4 py-6 sm:py-8 overflow-hidden">
      <div className="animated-gradient-bg" />
      <FloatingParticles count={10} />

      {/* Header */}
      <motion.div className="relative z-10 text-center mb-4 sm:mb-6"
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}>
        <p className="text-sm text-[var(--text-secondary)] mb-1">Welcome, {customerName}! 👋</p>
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: "'Satoshi', sans-serif" }}>
          <span className="gradient-accent-text">Spin</span> to Win
        </h1>
        <div className="flex items-center justify-center gap-2 mt-2">
          {Array.from({ length: MAX_DAILY_SPINS }).map((_, i) => (
            <div key={i} className={`w-3 h-3 rounded-full transition-all ${
              i < spinsRemaining
                ? "bg-[var(--accent-primary)] glow-sm"
                : "bg-[var(--bg-surface-light)]"
            }`} />
          ))}
          <span className="text-xs text-[var(--text-tertiary)] ml-1">{spinsRemaining} spin{spinsRemaining !== 1 ? "s" : ""} left</span>
        </div>
      </motion.div>

      {/* Wheel */}
      <motion.div className="relative z-10"
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}>
        <SpinWheel
          prizes={prizes}
          onSpinComplete={handleSpinComplete}
          spinning={spinning}
          targetIndex={targetIndex}
          disabled={spinsRemaining <= 0}
        />
      </motion.div>

      {/* Spin Button */}
      <motion.div className="relative z-10 mt-6 sm:mt-8 w-full max-w-xs px-4"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}>
        {spinsRemaining > 0 ? (
          <button onClick={handleSpin} disabled={spinning}
            className="btn-primary text-lg sm:text-xl w-full py-4 sm:py-5 animate-pulse-glow disabled:opacity-50 disabled:animate-none touch-manipulation">
            {spinning ? "Spinning..." : "🎰 SPIN!"}
          </button>
        ) : (
          <div className="text-center">
            <p className="text-[var(--text-secondary)] mb-2">No spins remaining today</p>
            <p className="text-sm text-[var(--text-tertiary)]">Come back tomorrow! 🌙</p>
          </div>
        )}
      </motion.div>

      {/* Error */}
      {error && (
        <motion.p className="relative z-10 mt-4 text-sm text-[var(--danger)]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {error}
        </motion.p>
      )}

      {/* Reward Modal */}
      <RewardModal
        result={spinResult}
        open={showModal}
        onClose={() => setShowModal(false)}
        onSpinAgain={handleSpinAgain}
        canSpinAgain={spinsRemaining > 0}
      />
    </main>
  );
}

/** Demo prizes when DB is empty */
function getDemoPrizes(): Prize[] {
  return [
    { id: "demo-1", restaurant_id: "", title: "Free Burger", image_url: null, probability: 15, daily_limit: 5, wins_today: 0, last_reset_date: null, active: true, created_at: "" },
    { id: "demo-2", restaurant_id: "", title: "Free Pizza", image_url: null, probability: 10, daily_limit: 3, wins_today: 0, last_reset_date: null, active: true, created_at: "" },
    { id: "demo-3", restaurant_id: "", title: "Free Drink", image_url: null, probability: 20, daily_limit: 10, wins_today: 0, last_reset_date: null, active: true, created_at: "" },
    { id: "demo-4", restaurant_id: "", title: "10% Discount", image_url: null, probability: 25, daily_limit: 20, wins_today: 0, last_reset_date: null, active: true, created_at: "" },
    { id: "demo-5", restaurant_id: "", title: "Free Dessert", image_url: null, probability: 15, daily_limit: 5, wins_today: 0, last_reset_date: null, active: true, created_at: "" },
    { id: "demo-6", restaurant_id: "", title: "Try Again", image_url: null, probability: 15, daily_limit: 99, wins_today: 0, last_reset_date: null, active: true, created_at: "" },
  ];
}
