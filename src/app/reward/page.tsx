"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { PRIZE_EMOJI } from "@/lib/constants";
import { getTimeRemaining } from "@/lib/utils";
import FloatingParticles from "@/components/particles/FloatingParticles";

interface StoredReward {
  prize_title: string;
  claim_code: string;
  expires_at: string;
  spins_remaining: number;
}

export default function RewardPage() {
  const router = useRouter();
  const [reward, setReward] = useState<StoredReward | null>(null);
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const stored = localStorage.getItem("spinbite_last_reward");
    if (!stored) { router.push("/spin"); return; }
    const parsed: StoredReward = JSON.parse(stored);
    setReward(parsed);

    // Fire confetti
    const end = Date.now() + 2500;
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors: ["#FF6B00", "#FFB800", "#FF8A00"] });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors: ["#FF6B00", "#FFB800", "#FF8A00"] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [router]);

  // Countdown timer
  useEffect(() => {
    if (!reward) return;
    const tick = () => setCountdown(getTimeRemaining(reward.expires_at));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [reward]);

  if (!reward) return null;

  const titleLower = reward.prize_title.toLowerCase();
  const emoji = Object.entries(PRIZE_EMOJI).find(([k]) => titleLower.includes(k))?.[1] ?? PRIZE_EMOJI.default;

  return (
    <main className="relative min-h-screen flex items-center justify-center px-6 py-12">
      <div className="animated-gradient-bg" />
      <FloatingParticles count={8} />

      <motion.div className="relative z-10 w-full max-w-sm"
        initial={{ opacity: 0, scale: 0.8, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>

        <div className="card-glass rounded-3xl p-8 text-center overflow-hidden">
          <div className="absolute inset-0 gradient-radial opacity-30 pointer-events-none" />

          <div className="relative z-10">
            <motion.div className="text-7xl mb-4"
              initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 10, stiffness: 200, delay: 0.2 }}>
              {emoji}
            </motion.div>

            <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "'Satoshi', sans-serif" }}>
              🎉 You Won!
            </h1>
            <p className="text-xl font-bold gradient-accent-text mb-6">{reward.prize_title}</p>

            {/* Claim Code */}
            <div className="glass rounded-xl p-5 mb-6">
              <p className="text-xs text-[var(--text-secondary)] uppercase tracking-widest mb-2">Your Claim Code</p>
              <p className="text-4xl font-black tracking-[0.15em] text-[var(--accent-primary)]"
                style={{ fontFamily: "'Satoshi', sans-serif" }}>
                {reward.claim_code}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-2">Show this code to the cashier</p>
            </div>

            {/* Countdown */}
            {!countdown.expired ? (
              <div className="flex items-center justify-center gap-3 mb-6">
                <TimeUnit value={countdown.hours} label="HRS" />
                <span className="text-[var(--accent-primary)] text-xl font-bold">:</span>
                <TimeUnit value={countdown.minutes} label="MIN" />
                <span className="text-[var(--accent-primary)] text-xl font-bold">:</span>
                <TimeUnit value={countdown.seconds} label="SEC" />
              </div>
            ) : (
              <p className="text-sm text-[var(--danger)] mb-6">This reward has expired</p>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3">
              {reward.spins_remaining > 0 ? (
                <button onClick={() => router.push("/spin")} className="btn-primary w-full">
                  🎰 Spin Again ({reward.spins_remaining} left)
                </button>
              ) : (
                <p className="text-sm text-[var(--text-secondary)] py-2">Come back tomorrow! 🌙</p>
              )}
              <button onClick={() => router.push("/")} className="btn-secondary w-full">
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="glass rounded-lg px-3 py-2 min-w-[52px]">
      <p className="text-xl font-bold text-white tabular-nums">{String(value).padStart(2, "0")}</p>
      <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">{label}</p>
    </div>
  );
}
