/** SpinBite constants */

/** Maximum number of spins a customer can perform per day */
export const MAX_DAILY_SPINS = 2;

/** Claim code expiry in hours */
export const CLAIM_EXPIRY_HOURS = 24;

/** Restaurant ID (single-restaurant MVP) */
export const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID || "";

/** Wheel segment colors (alternating for visual clarity) */
export const WHEEL_COLORS = [
  "#FF6B00", // primary accent
  "#1a1a24", // dark surface
  "#FFB800", // secondary accent
  "#13131A", // surface
  "#FF8A00", // glow
  "#1f1f2e", // surface-hover
] as const;

/** Prize emoji map for fallback when no image */
export const PRIZE_EMOJI: Record<string, string> = {
  burger: "🍔",
  pizza: "🍕",
  drink: "🥤",
  dessert: "🍰",
  discount: "💰",
  retry: "🔄",
  fries: "🍟",
  coffee: "☕",
  default: "🎁",
};

/** Animation durations in ms */
export const ANIMATION = {
  pageTransition: 400,
  wheelSpin: 5000,
  wheelBounce: 800,
  confetti: 3000,
  modalReveal: 600,
} as const;
