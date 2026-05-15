"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { RESTAURANT_ID } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Search, Trash2, ChevronDown, ChevronUp, Ticket, Copy, Check } from "lucide-react";

interface ClaimInfo {
  claim_code: string;
  claimed: boolean;
  claimed_at: string | null;
  expires_at: string;
  prize_title: string;
  created_at: string;
}

interface CustomerRow {
  id: string;
  full_name: string;
  phone: string;
  spins_today: number;
  created_at: string;
  total_spins: number;
  rewards_won: number;
  claims: ClaimInfo[];
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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

            // Fetch all spins with their claims and prize info
            const { data: customerSpins } = await supabase
              .from("spins").select("id, created_at, prize_id, prizes(title)")
              .eq("customer_id", c.id)
              .order("created_at", { ascending: false });

            let rewardsWon = 0;
            const claims: ClaimInfo[] = [];

            if (customerSpins && customerSpins.length > 0) {
              const spinIds = customerSpins.map((s: { id: string }) => s.id);
              
              // Fetch all claims for this customer's spins
              const { data: claimData, count: claimCount } = await supabase
                .from("claims").select("*", { count: "exact" })
                .in("spin_id", spinIds);
              
              rewardsWon = claimCount || 0;

              // Build claim info with prize titles
              if (claimData) {
                for (const claim of claimData) {
                  const spin = customerSpins.find((s: { id: string }) => s.id === claim.spin_id);
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const prizeTitle = spin?.prizes ? (spin.prizes as any).title || "Unknown Prize" : "Unknown Prize";
                  claims.push({
                    claim_code: claim.claim_code,
                    claimed: claim.claimed,
                    claimed_at: claim.claimed_at,
                    expires_at: claim.expires_at,
                    prize_title: prizeTitle,
                    created_at: spin?.created_at || claim.expires_at,
                  });
                }
              }
            }

            return {
              ...c,
              total_spins: totalSpins || 0,
              rewards_won: rewardsWon,
              claims,
            };
          })
        );
        setCustomers(enriched);
      }
      setLoading(false);
    }
    fetchCustomers();
  }, []);

  const deleteCustomer = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this customer? Their spins and claims will also be deleted.")) return;
    
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) {
      alert("Failed to delete customer.");
      console.error(error);
    } else {
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      if (expandedId === id) setExpandedId(null);
    }
  };

  const clearAllCustomers = async () => {
    if (!window.confirm("WARNING: Are you sure you want to delete ALL customers for this restaurant? This cannot be undone.")) return;
    
    const { error } = await supabase.from("customers").delete().eq("restaurant_id", RESTAURANT_ID);
    if (error) {
      alert("Failed to clear customers.");
      console.error(error);
    } else {
      setCustomers([]);
      setExpandedId(null);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getClaimStatus = (claim: ClaimInfo) => {
    if (claim.claimed) return { label: "Claimed", color: "var(--success)", bg: "rgba(34,197,94,0.12)" };
    const expired = new Date(claim.expires_at).getTime() < Date.now();
    if (expired) return { label: "Expired", color: "var(--danger)", bg: "rgba(239,68,68,0.12)" };
    return { label: "Active", color: "var(--accent-primary)", bg: "rgba(255,107,0,0.12)" };
  };

  const filtered = customers.filter((c) =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.claims.some(cl => cl.claim_code.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: "'Satoshi', sans-serif" }}>Customers</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">{customers.length} registered customers</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input type="text" placeholder="Search name, phone, or code"
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 text-sm" />
          </div>
          {customers.length > 0 && (
            <button 
              onClick={clearAllCustomers}
              className="btn-secondary text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white transition-colors w-full sm:w-auto"
            >
              <Trash2 size={16} />
              Clear All
            </button>
          )}
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
                  <th className="text-center py-3 px-4 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Codes</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Joined</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <motion.tr key={c.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-[var(--border-subtle)] last:border-0 group"
                    style={{ verticalAlign: "top" }}
                  >
                    <td className="py-3 px-4 font-medium">{c.full_name}</td>
                    <td className="py-3 px-4 text-[var(--text-secondary)]">{c.phone}</td>
                    <td className="py-3 px-4 text-center">{c.total_spins}</td>
                    <td className="py-3 px-4 text-center text-[var(--success)]">{c.rewards_won}</td>
                    <td className="py-3 px-4 text-center">
                      {c.claims.length > 0 ? (
                        <button 
                          onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all hover:bg-white/5"
                          style={{ 
                            color: "var(--accent-primary)",
                            background: expandedId === c.id ? "rgba(255,107,0,0.12)" : "transparent"
                          }}
                        >
                          <Ticket size={13} />
                          {c.claims.length}
                          {expandedId === c.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      ) : (
                        <span className="text-[var(--text-tertiary)] text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-[var(--text-tertiary)] text-xs">{formatDate(c.created_at)}</td>
                    <td className="py-3 px-4 text-right">
                      <button 
                        onClick={() => deleteCustomer(c.id)}
                        className="p-2 rounded-lg text-[var(--text-tertiary)] hover:bg-white/5 hover:text-[var(--danger)] transition-colors inline-flex"
                        title="Delete Customer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Expanded Claim Codes Panel */}
          <AnimatePresence>
            {expandedId && (() => {
              const customer = filtered.find(c => c.id === expandedId);
              if (!customer || customer.claims.length === 0) return null;
              return (
                <motion.div
                  key={expandedId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden border-t border-[var(--border-subtle)]"
                >
                  <div className="p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Ticket size={14} className="text-[var(--accent-primary)]" />
                      <span className="text-xs font-medium text-[var(--text-secondary)]">
                        Claim codes for <span className="text-white">{customer.full_name}</span>
                      </span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {customer.claims.map((claim) => {
                        const status = getClaimStatus(claim);
                        return (
                          <div
                            key={claim.claim_code}
                            className="rounded-xl p-3 border border-[var(--border-subtle)] transition-all hover:border-[var(--accent-primary)]/30"
                            style={{ background: "rgba(255,255,255,0.03)" }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-bold tracking-wider text-[var(--accent-primary)]" style={{ fontFamily: "'Satoshi', monospace" }}>
                                {claim.claim_code}
                              </span>
                              <button
                                onClick={() => copyCode(claim.claim_code)}
                                className="p-1 rounded-md hover:bg-white/10 transition-colors"
                                title="Copy code"
                              >
                                {copiedCode === claim.claim_code
                                  ? <Check size={13} className="text-[var(--success)]" />
                                  : <Copy size={13} className="text-[var(--text-tertiary)]" />
                                }
                              </button>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] mb-1.5">{claim.prize_title}</p>
                            <div className="flex items-center justify-between">
                              <span 
                                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                                style={{ color: status.color, background: status.bg }}
                              >
                                {status.label}
                              </span>
                              <span className="text-[10px] text-[var(--text-tertiary)]">
                                {formatDate(claim.created_at)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
