"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import type { SpinResult } from "@/types/database";
import { PRIZE_EMOJI } from "@/lib/constants";
import { playWinSound, playLoseSound } from "@/lib/audio";

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

      // Play sound via shared AudioContext (mobile-compatible)
      if (isWin) {
        playWinSound();
      } else {
        playLoseSound();
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
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
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

          {/* Modal Card — slides up from bottom on mobile, centered on desktop */}
          <motion.div
            className="relative z-10 w-full sm:max-w-sm"
            initial={{ scale: 0.95, opacity: 0, y: 60 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 40 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
              delay: 0.1,
            }}
          >
            <div className="card-glass rounded-t-[28px] sm:rounded-[24px] p-6 sm:p-8 text-center overflow-hidden safe-area-bottom">
              {/* Glow background effect */}
              <div className="absolute inset-0 gradient-radial opacity-40 pointer-events-none" />

              {/* Content */}
              <div className="relative z-10">
                {/* Drag handle for mobile */}
                <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4 sm:hidden" />

                {/* Trophy/Prize emoji */}
                <motion.div
                  className="text-6xl sm:text-7xl mb-3 sm:mb-4"
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
                  className="text-xl sm:text-2xl font-bold mb-1"
                  style={{ fontFamily: "'Satoshi', sans-serif" }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {isWin ? "🎉 You Won!" : "Oh no!"}
                </motion.h2>

                {/* Prize title */}
                <motion.p
                  className={`text-lg sm:text-xl font-bold mb-5 sm:mb-6 ${isWin ? "gradient-accent-text" : "text-[var(--text-secondary)]"}`}
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
                      className="glass rounded-xl p-4 mb-5 sm:mb-6"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <p className="text-xs text-[var(--text-secondary)] uppercase tracking-widest mb-2">
                        Your Claim Code
                      </p>
                      <p
                        className="text-2xl sm:text-3xl font-black tracking-[0.15em] text-[var(--accent-primary)]"
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
                      className="text-xs text-[var(--text-tertiary)] mb-5 sm:mb-6"
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
                      className="btn-primary w-full text-base py-4"
                    >
                      🎰 Spin Again
                    </button>
                  ) : (
                    <p className="text-sm text-[var(--text-secondary)] py-2">
                      Come back tomorrow! 🌙
                    </p>
                  )}
                  <button onClick={onClose} className="btn-secondary w-full text-base py-4">
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
