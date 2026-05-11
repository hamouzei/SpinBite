"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { RESTAURANT_ID } from "@/lib/constants";
import type { Prize } from "@/types/database";
import { Plus, Pencil, Trash2, X, ToggleLeft, ToggleRight } from "lucide-react";

export default function PrizesPage() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [probability, setProbability] = useState(10);
  const [dailyLimit, setDailyLimit] = useState(10);
  const [active, setActive] = useState(true);

  const fetchPrizes = useCallback(async () => {
    const { data } = await supabase
      .from("prizes").select("*")
      .eq("restaurant_id", RESTAURANT_ID)
      .eq("deleted", false)
      .order("created_at", { ascending: false });
    setPrizes(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPrizes(); }, [fetchPrizes]);

  const resetForm = () => {
    setTitle(""); setProbability(10); setDailyLimit(10); setActive(true);
    setEditingPrize(null); setShowForm(false);
  };

  const openEdit = (prize: Prize) => {
    setEditingPrize(prize);
    setTitle(prize.title);
    setProbability(prize.probability);
    setDailyLimit(prize.daily_limit);
    setActive(prize.active);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    if (editingPrize) {
      await supabase.from("prizes").update({ title, probability, daily_limit: dailyLimit, active }).eq("id", editingPrize.id);
    } else {
      await supabase.from("prizes").insert({ restaurant_id: RESTAURANT_ID, title, probability, daily_limit: dailyLimit, active });
    }
    resetForm();
    fetchPrizes();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Soft delete this prize?")) return;
    await supabase.from("prizes").update({ deleted: true }).eq("id", id);
    fetchPrizes();
  };

  const toggleActive = async (prize: Prize) => {
    await supabase.from("prizes").update({ active: !prize.active }).eq("id", prize.id);
    fetchPrizes();
  };

  const totalProb = prizes.filter(p => p.active).reduce((sum, p) => sum + p.probability, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: "'Satoshi', sans-serif" }}>Prizes</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Manage your wheel rewards</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary text-sm px-5 py-2.5">
          <Plus size={16} /> Add Prize
        </button>
      </div>

      {/* Probability warning */}
      {totalProb > 0 && totalProb !== 100 && (
        <div className="glass-accent rounded-xl p-3 mb-4 text-sm text-[var(--accent-primary)]">
          ⚠️ Active prize probabilities total {totalProb}% (should be 100%)
        </div>
      )}

      {/* Form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60" onClick={resetForm} />
            <motion.div className="relative z-10 w-full max-w-md card-glass rounded-2xl p-6"
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold" style={{ fontFamily: "'Satoshi', sans-serif" }}>
                  {editingPrize ? "Edit Prize" : "New Prize"}
                </h2>
                <button onClick={resetForm} className="text-[var(--text-tertiary)] hover:text-white"><X size={20} /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Title</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Free Burger" className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Probability (%)</label>
                  <input type="number" value={probability} onChange={(e) => setProbability(Number(e.target.value))}
                    min={0} max={100} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Daily Limit</label>
                  <input type="number" value={dailyLimit} onChange={(e) => setDailyLimit(Number(e.target.value))}
                    min={1} className="input" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">Active</span>
                  <button onClick={() => setActive(!active)} className="text-[var(--accent-primary)]">
                    {active ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-[var(--text-tertiary)]" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={resetForm} className="btn-secondary flex-1 py-2.5 text-sm">Cancel</button>
                <button onClick={handleSave} className="btn-primary flex-1 py-2.5 text-sm">
                  {editingPrize ? "Update" : "Create"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prizes table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card rounded-xl h-16 animate-pulse" />
          ))}
        </div>
      ) : prizes.length === 0 ? (
        <div className="card rounded-2xl p-12 text-center">
          <p className="text-4xl mb-3">🎁</p>
          <p className="text-[var(--text-secondary)]">No prizes yet. Add your first reward!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {prizes.map((prize) => (
            <motion.div key={prize.id} layout
              className="card rounded-xl p-4 flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${prize.active ? "bg-[var(--success)]" : "bg-[var(--text-tertiary)]"}`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{prize.title}</p>
                <p className="text-xs text-[var(--text-tertiary)]">
                  {prize.probability}% chance · {prize.daily_limit}/day limit · {prize.wins_today} wins today
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggleActive(prize)}
                  className="p-2 rounded-lg hover:bg-[var(--bg-surface-hover)] text-[var(--text-tertiary)] hover:text-white transition-colors">
                  {prize.active ? <ToggleRight size={18} className="text-[var(--success)]" /> : <ToggleLeft size={18} />}
                </button>
                <button onClick={() => openEdit(prize)}
                  className="p-2 rounded-lg hover:bg-[var(--bg-surface-hover)] text-[var(--text-tertiary)] hover:text-white transition-colors">
                  <Pencil size={16} />
                </button>
                <button onClick={() => handleDelete(prize.id)}
                  className="p-2 rounded-lg hover:bg-[var(--bg-surface-hover)] text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
