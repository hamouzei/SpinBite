"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/admin/dashboard");
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-[var(--bg-primary)]">
      <div className="animated-gradient-bg" />

      <motion.div className="relative z-10 w-full max-w-sm"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>

        <div className="card-glass rounded-3xl p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl gradient-accent flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4"
              style={{ fontFamily: "'Satoshi', sans-serif" }}>
              SB
            </div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "'Satoshi', sans-serif" }}>
              Admin <span className="gradient-accent-text">Login</span>
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Sign in to manage your restaurant</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@restaurant.com" className="input" required />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" className="input" required />
            </div>

            {error && (
              <motion.p className="text-sm text-[var(--danger)] text-center"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {error}
              </motion.p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="text-center mt-6">
            <a href="/" className="text-sm text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors">
              ← Back to website
            </a>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
