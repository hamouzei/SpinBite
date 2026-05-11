"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import type { SpinResult } from "@/types/database";
import { PRIZE_EMOJI } from "@/lib/constants";

interface RewardModalProps {
  result: SpinResult | null;
  open: boolean;
  onClose: () => void;
  onSpinAgain?: () => void;
  canSpinAgain: boolean;
}

export default function RewardModal({
  result,
  open,
  onClose,
  onSpinAgain,
  canSpinAgain,
}: RewardModalProps) {
  const confettiFired = useRef(false);

  useEffect(() => {
    if (open && result && !confettiFired.current) {
      confettiFired.current = true;

      const titleLower = result.prize_title.toLowerCase();
      const isWin = !titleLower.includes("try again") && !titleLower.includes("nothing");

      // Play sound
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          if (isWin) {
            // Happy arpeggio (C major)
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
              const osc = ctx.createOscillator();
              const gainNode = ctx.createGain();
              osc.type = "sine";
              osc.frequency.value = freq;
              gainNode.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
              gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.1 + 0.05);
              gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.3);
              osc.connect(gainNode);
              gainNode.connect(ctx.destination);
              osc.start(ctx.currentTime + i * 0.1);
              osc.stop(ctx.currentTime + i * 0.1 + 0.3);
            });
          } else {
            // Womp womp (descending tone)
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(300, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.5);
            gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.5);
          }
        }
      } catch (e) {
        // Ignore audio errors
      }

      if (isWin) {
        // Fire confetti burst
        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
          confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.7 },
            colors: ["#FF6B00", "#FFB800", "#FF8A00", "#22C55E"],
          });
          confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.7 },
            colors: ["#FF6B00", "#FFB800", "#FF8A00", "#22C55E"],
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        };
        frame();
      }
    }

    if (!open) {
      confettiFired.current = false;
    }
  }, [open, result]);

  if (!result) return null;

  // Get emoji for the prize
  const titleLower = result.prize_title.toLowerCase();
  const isWin = !titleLower.includes("try again") && !titleLower.includes("nothing");
  const emoji =
    Object.entries(PRIZE_EMOJI).find(([key]) =>
      titleLower.includes(key)
    )?.[1] ?? (isWin ? PRIZE_EMOJI.default : "😢");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal Card */}
          <motion.div
            className="relative z-10 w-full max-w-sm"
            initial={{ scale: 0.5, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{
              type: "spring",
              damping: 20,
              stiffness: 300,
              delay: 0.1,
            }}
          >
            <div className="card-glass rounded-[24px] p-8 text-center overflow-hidden">
              {/* Glow background effect */}
              <div className="absolute inset-0 gradient-radial opacity-40 pointer-events-none" />

              {/* Content */}
              <div className="relative z-10">
                {/* Trophy/Prize emoji */}
                <motion.div
                  className="text-7xl mb-4"
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    damping: 10,
                    stiffness: 200,
                    delay: 0.3,
                  }}
                >
                  {emoji}
                </motion.div>

                {/* Congratulations or Better luck next time */}
                <motion.h2
                  className="text-2xl font-bold mb-1"
                  style={{ fontFamily: "'Satoshi', sans-serif" }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {isWin ? "🎉 You Won!" : "Oh no!"}
                </motion.h2>

                {/* Prize title */}
                <motion.p
                  className={`text-xl font-bold mb-6 ${isWin ? "gradient-accent-text" : "text-[var(--text-secondary)]"}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  {isWin ? result.prize_title : "Better luck next time"}
                </motion.p>

                {/* Claim code (only if won) */}
                {isWin && (
                  <>
                    <motion.div
                      className="glass rounded-xl p-4 mb-6"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <p className="text-xs text-[var(--text-secondary)] uppercase tracking-widest mb-2">
                        Your Claim Code
                      </p>
                      <p
                        className="text-3xl font-black tracking-[0.15em] text-[var(--accent-primary)]"
                        style={{ fontFamily: "'Satoshi', sans-serif" }}
                      >
                        {result.claim_code}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-2">
                        Show this code to the cashier
                      </p>
                    </motion.div>

                    {/* Expiry */}
                    <motion.p
                      className="text-xs text-[var(--text-tertiary)] mb-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 }}
                    >
                      Expires:{" "}
                      {new Date(result.expires_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </motion.p>
                  </>
                )}

                {/* Actions */}
                <motion.div
                  className="flex flex-col gap-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  {canSpinAgain ? (
                    <button
                      onClick={onSpinAgain}
                      className="btn-primary w-full"
                    >
                      🎰 Spin Again
                    </button>
                  ) : (
                    <p className="text-sm text-[var(--text-secondary)] py-2">
                      Come back tomorrow! 🌙
                    </p>
                  )}
                  <button onClick={onClose} className="btn-secondary w-full">
                    Done
                  </button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
