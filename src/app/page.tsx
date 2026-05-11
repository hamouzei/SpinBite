"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import FloatingParticles from "@/components/particles/FloatingParticles";

const features = [
  {
    emoji: "🎁",
    title: "Real Rewards",
    description: "Win actual food items — burgers, pizzas, drinks and more!",
  },
  {
    emoji: "⚡",
    title: "Instant Wins",
    description: "Spin the wheel and win instantly. No waiting, no hassle.",
  },
  {
    emoji: "✨",
    title: "Fast Claiming",
    description: "Show your code to the cashier and enjoy your reward.",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background effects */}
      <div className="animated-gradient-bg" />
      <FloatingParticles count={12} />

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        {/* Decorative wheel preview */}
        <motion.div
          className="relative mb-8"
          initial={{ opacity: 0, scale: 0.6, rotate: -30 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 relative">
            {/* Rotating wheel graphic */}
            <div className="absolute inset-0 rounded-full animate-spin-slow opacity-80">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                {[0, 1, 2, 3, 4, 5].map((i) => {
                  const startAngle = i * 60 - 90;
                  const endAngle = startAngle + 60;
                  const startRad = (startAngle * Math.PI) / 180;
                  const endRad = (endAngle * Math.PI) / 180;
                  const r = 90;
                  const cx = 100;
                  const cy = 100;
                  return (
                    <path
                      key={i}
                      d={`M${cx},${cy} L${cx + r * Math.cos(startRad)},${cy + r * Math.sin(startRad)} A${r},${r} 0 0 1 ${cx + r * Math.cos(endRad)},${cy + r * Math.sin(endRad)} Z`}
                      fill={
                        i % 2 === 0
                          ? "rgba(255, 107, 0, 0.6)"
                          : "rgba(26, 26, 36, 0.8)"
                      }
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="0.5"
                    />
                  );
                })}
                <circle cx="100" cy="100" r="14" fill="var(--accent-primary)" />
              </svg>
            </div>
            {/* Glow behind wheel */}
            <div className="absolute inset-[-20px] rounded-full bg-[var(--accent-primary)] opacity-15 blur-3xl" />
          </div>
        </motion.div>

        {/* Headlines */}
        <motion.h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-4 leading-tight"
          style={{ fontFamily: "'Satoshi', sans-serif" }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="gradient-accent-text">Spin The Wheel</span>
          <br />
          <span className="text-white">Win Real Rewards</span>
        </motion.h1>

        <motion.p
          className="text-lg sm:text-xl text-[var(--text-secondary)] mb-8 max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          Get a chance to win free food, drinks and discounts every day! 🍕🥤
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <Link href="/register" className="btn-primary text-lg px-10 py-4">
            🎰 Start Spinning
          </Link>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1.5">
            <div className="w-1.5 h-3 rounded-full bg-[var(--accent-primary)]" />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-6 py-24 max-w-5xl mx-auto">
        <motion.h2
          className="text-3xl sm:text-4xl font-bold text-center mb-16"
          style={{ fontFamily: "'Satoshi', sans-serif" }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          How It <span className="gradient-accent-text">Works</span>
        </motion.h2>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              variants={item}
              className="card-glass rounded-2xl p-8 text-center group"
            >
              <div className="text-5xl mb-5 transition-transform duration-300 group-hover:scale-110">
                {feature.emoji}
              </div>
              <h3
                className="text-xl font-bold mb-3"
                style={{ fontFamily: "'Satoshi', sans-serif" }}
              >
                {feature.title}
              </h3>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-24 text-center">
        <motion.div
          className="max-w-lg mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{ fontFamily: "'Satoshi', sans-serif" }}
          >
            Ready to <span className="gradient-accent-text">Win</span>?
          </h2>
          <p className="text-[var(--text-secondary)] mb-8">
            It only takes 10 seconds. Register and spin to win real food
            rewards today.
          </p>
          <Link href="/register" className="btn-primary text-lg px-10 py-4">
            🎰 Start Spinning
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[var(--border-subtle)] py-8 px-6 text-center">
        <p className="text-sm text-[var(--text-tertiary)]">
          © {new Date().getFullYear()} SpinBite. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
