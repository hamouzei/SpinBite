"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { RESTAURANT_ID } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Search } from "lucide-react";

interface CustomerRow {
  id: string;
  full_name: string;
  phone: string;
  spins_today: number;
  created_at: string;
  total_spins: number;
  rewards_won: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchCustomers() {
      const { data } = await supabase
        .from("customers").select("*")
        .eq("restaurant_id", RESTAURANT_ID)
        .order("created_at", { ascending: false });

      if (data) {
        const enriched: CustomerRow[] = await Promise.all(
          data.map(async (c) => {
            // Count total spins
            const { count: totalSpins } = await supabase
              .from("spins").select("id", { count: "exact", head: true })
              .eq("customer_id", c.id);

            // Count rewards won — get all spin IDs, then count claims for those spins
            const { data: customerSpins } = await supabase
              .from("spins").select("id")
              .eq("customer_id", c.id);

            let rewardsWon = 0;
            if (customerSpins && customerSpins.length > 0) {
              const spinIds = customerSpins.map((s: { id: string }) => s.id);
              const { count: claimCount } = await supabase
                .from("claims").select("id", { count: "exact", head: true })
                .in("spin_id", spinIds);
              rewardsWon = claimCount || 0;
            }

            return {
              ...c,
              total_spins: totalSpins || 0,
              rewards_won: rewardsWon,
            };
          })
        );
        setCustomers(enriched);
      }
      setLoading(false);
    }
    fetchCustomers();
  }, []);

  const filtered = customers.filter((c) =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: "'Satoshi', sans-serif" }}>Customers</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">{customers.length} registered customers</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input type="text" placeholder="Search by name or phone"
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 text-sm" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card rounded-xl h-14 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card rounded-2xl p-12 text-center">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-[var(--text-secondary)]">
            {search ? "No customers match your search" : "No customers yet"}
          </p>
        </div>
      ) : (
        <div className="card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  <th className="text-left py-3 px-4 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Name</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Phone</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Spins</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Rewards</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <motion.tr key={c.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-surface-hover)] transition-colors">
                    <td className="py-3 px-4 font-medium">{c.full_name}</td>
                    <td className="py-3 px-4 text-[var(--text-secondary)]">{c.phone}</td>
                    <td className="py-3 px-4 text-center">{c.total_spins}</td>
                    <td className="py-3 px-4 text-center text-[var(--success)]">{c.rewards_won}</td>
                    <td className="py-3 px-4 text-right text-[var(--text-tertiary)] text-xs">{formatDate(c.created_at)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
