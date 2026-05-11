"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { RESTAURANT_ID, MAX_DAILY_SPINS } from "@/lib/constants";
import FloatingParticles from "@/components/particles/FloatingParticles";

const schema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(50),
  phone: z.string().min(7, "Phone number is too short").max(20)
    .regex(/^[+]?[\d\s()-]+$/, "Invalid phone format"),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    try {
      const { data: existing } = await supabase
        .from("customers").select("*")
        .eq("restaurant_id", RESTAURANT_ID)
        .eq("phone", data.phone).single();

      if (existing) {
        const today = new Date().toISOString().split("T")[0];
        const spinsUsed = existing.last_spin_date === today ? existing.spins_today : 0;
        if (spinsUsed >= MAX_DAILY_SPINS) {
          setError("You've used all your spins today. Come back tomorrow! 🌙");
          setLoading(false);
          return;
        }
        localStorage.setItem("spinbite_customer_id", existing.id);
        localStorage.setItem("spinbite_customer_name", existing.full_name);
        localStorage.setItem("spinbite_spins_remaining", String(MAX_DAILY_SPINS - spinsUsed));
        router.push("/spin");
        return;
      }

      const { data: newCust, error: insertErr } = await supabase
        .from("customers")
        .insert({ restaurant_id: RESTAURANT_ID, full_name: data.full_name, phone: data.phone })
        .select().single();

      if (insertErr) throw insertErr;
      if (newCust) {
        localStorage.setItem("spinbite_customer_id", newCust.id);
        localStorage.setItem("spinbite_customer_name", newCust.full_name);
        localStorage.setItem("spinbite_spins_remaining", String(MAX_DAILY_SPINS));
        router.push("/spin");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center px-6 py-12">
      <div className="animated-gradient-bg" />
      <FloatingParticles count={8} />

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="card-glass rounded-3xl p-8 sm:p-10">
          <div className="text-center mb-8">
            <motion.div className="text-5xl mb-4"
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 10, stiffness: 200, delay: 0.2 }}>
              🎰
            </motion.div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ fontFamily: "'Satoshi', sans-serif" }}>
              Ready to <span className="gradient-accent-text">Spin</span>?
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">Enter your details to start winning rewards</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Full Name</label>
              <input id="full_name" type="text" placeholder="Enter your name"
                className={`input ${errors.full_name ? "input-error" : ""}`} {...register("full_name")} />
              {errors.full_name && <p className="text-xs text-[var(--danger)] mt-1.5">{errors.full_name.message}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Phone Number</label>
              <input id="phone" type="tel" placeholder="+1 (555) 123-4567"
                className={`input ${errors.phone ? "input-error" : ""}`} {...register("phone")} />
              {errors.phone && <p className="text-xs text-[var(--danger)] mt-1.5">{errors.phone.message}</p>}
            </div>

            {error && (
              <motion.div className="glass-accent rounded-xl p-3 text-center"
                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                <p className="text-sm text-[var(--accent-primary)]">{error}</p>
              </motion.div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                  </svg>
                  Registering...
                </span>
              ) : "🎰 Let's Spin!"}
            </button>
          </form>

          <div className="text-center mt-6">
            <a href="/" className="text-sm text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors">← Back to home</a>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
