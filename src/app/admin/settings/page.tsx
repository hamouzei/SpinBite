"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { RESTAURANT_ID } from "@/lib/constants";
import type { Restaurant } from "@/types/database";
import { Save } from "lucide-react";

export default function SettingsPage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [name, setName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#FF6B00");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchRestaurant() {
      const { data } = await supabase
        .from("restaurants").select("*")
        .eq("id", RESTAURANT_ID).single();
      if (data) {
        setRestaurant(data);
        setName(data.name);
        setPrimaryColor(data.primary_color);
      }
      setLoading(false);
    }
    fetchRestaurant();
  }, []);

  const handleSave = async () => {
    if (!restaurant) return;
    setSaving(true);
    await supabase.from("restaurants")
      .update({ name, primary_color: primaryColor })
      .eq("id", restaurant.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="card rounded-2xl h-16 animate-pulse" />
        <div className="card rounded-2xl h-48 animate-pulse" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: "'Satoshi', sans-serif" }}>Settings</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Customize your restaurant branding</p>
      </div>

      <motion.div className="max-w-lg space-y-6"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}>

        <div className="card rounded-2xl p-6 space-y-5">
          <h2 className="font-bold text-lg" style={{ fontFamily: "'Satoshi', sans-serif" }}>Restaurant Info</h2>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Restaurant Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Brand Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-12 rounded-xl border border-[var(--border-subtle)] cursor-pointer bg-transparent" />
              <input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)}
                className="input flex-1" placeholder="#FF6B00" />
            </div>
          </div>

          <div className="pt-2">
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm px-6 py-2.5 disabled:opacity-50">
              {saving ? "Saving..." : saved ? "✓ Saved!" : <><Save size={16} /> Save Changes</>}
            </button>
          </div>
        </div>

        {/* Restaurant ID info */}
        <div className="card rounded-2xl p-6">
          <h2 className="font-bold text-lg mb-3" style={{ fontFamily: "'Satoshi', sans-serif" }}>Technical Info</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--text-tertiary)]">Restaurant ID</span>
              <span className="text-[var(--text-secondary)] font-mono text-xs">{RESTAURANT_ID || "Not set"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-tertiary)]">Created</span>
              <span className="text-[var(--text-secondary)]">
                {restaurant?.created_at ? new Date(restaurant.created_at).toLocaleDateString() : "—"}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
