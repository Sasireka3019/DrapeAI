// Server-safe. Pure functions — no side effects, fully deterministic.
import type {
  Outfit,
  Earrings,
  Bracelet,
  Shoes,
  Bag,
  LipstickShade,
  Hairstyle,
  RankedLook,
  ScoreBreakdown,
  OutfitType,
} from "@/types/catalog";
import type { StylingProfile, UserPreferences } from "@/types/styling";
import {
  getOutfits,
  getEarrings,
  getBracelets,
  getShoes,
  getBags,
  getLipsticks,
  getHairstyles,
} from "@/lib/catalog";

// ─── Weights ──────────────────────────────────────────────────────────────────

export interface ScoringWeights {
  colour: number;       // 0.30 — undertone match across outfit + earrings + bracelet
  occasion: number;     // 0.20 — occasion tag match across all items
  style: number;        // 0.20 — style tag match across outfit + earrings + bracelet + hairstyle
  silhouette: number;   // 0.15 — earring/bracelet visual harmony with outfit silhouette
  budget: number;       // 0.10 — how well the look uses (not exceeds) the budget
  coordination: number; // 0.05 — all accessories declare compatibility with outfit type
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  colour:       0.30,
  occasion:     0.20,
  style:        0.20,
  silhouette:   0.15,
  budget:       0.10,
  coordination: 0.05,
};

// ─── Catalog injection interface ──────────────────────────────────────────────

export interface CatalogSnapshot {
  outfits:    Outfit[];
  earrings:   Earrings[];
  bracelets:  Bracelet[];
  shoes:      Shoes[];
  bags:       Bag[];
  lipsticks:  LipstickShade[];
  hairstyles: Hairstyle[];
}

function liveCatalog(): CatalogSnapshot {
  return {
    outfits:    getOutfits(),
    earrings:   getEarrings(),
    bracelets:  getBracelets(),
    shoes:      getShoes(),
    bags:       getBags(),
    lipsticks:  getLipsticks(),
    hairstyles: getHairstyles(),
  };
}

// ─── Score sub-functions (all exported for unit testing) ─────────────────────

/** 0–1: fraction of undertone-tagged items that match the profile's undertone. */
export function scoreColour(
  outfit: Outfit,
  earrings: Earrings,
  bracelet: Bracelet,
  profile: StylingProfile
): number {
  const { undertone } = profile;
  let matches = 0;
  const items = [outfit, earrings, bracelet] as const;
  for (const item of items) {
    if (item.undertones.includes(undertone)) matches++;
  }
  return matches / items.length;
}

/** 0–1: fraction of items that include the occasion in their `occasions` array. */
export function scoreOccasion(
  outfit: Outfit,
  earrings: Earrings,
  bracelet: Bracelet,
  shoes: Shoes,
  lipstick: LipstickShade,
  occasion: string
): number {
  const items = [outfit, earrings, bracelet, shoes, lipstick];
  let matches = 0;
  for (const item of items) {
    if (item.occasions.includes(occasion)) matches++;
  }
  return matches / items.length;
}

/** 0–1: fraction of style-tagged items that include the requested style. */
export function scoreStyle(
  outfit: Outfit,
  earrings: Earrings,
  bracelet: Bracelet,
  hairstyle: Hairstyle,
  style: string
): number {
  const items = [outfit, earrings, bracelet, hairstyle];
  let matches = 0;
  for (const item of items) {
    if (item.styles.includes(style)) matches++;
  }
  return matches / items.length;
}

/**
 * 0–1: visual harmony between earrings/bracelet and the outfit silhouette.
 *
 * Rules (both conditions averaged):
 *  - Voluminous/full silhouette → delicate accessories score 1.0, statement 0.6
 *  - Fitted/structured silhouette → statement accessories score 1.0, delicate 0.7
 *  - Neutral → both score 0.85
 *  - Earring + bracelet style agreement (both delicate, both statement, or mixed) is averaged in.
 */
export function scoreSilhouette(
  outfit: Outfit,
  earrings: Earrings,
  bracelet: Bracelet
): number {
  const tags = outfit.silhouetteTags ?? [];
  const isVoluminous = tags.some(t =>
    ["voluminous", "flared", "full", "flowy", "draped"].includes(t.toLowerCase())
  );
  const isFitted = tags.some(t =>
    ["fitted", "structured", "bodycon", "tailored", "slim"].includes(t.toLowerCase())
  );

  function accessoryHarmony(style: string): number {
    const isDelicate = ["delicate", "minimal", "subtle", "small", "stud"].some(k =>
      style.toLowerCase().includes(k)
    );
    const isStatement = ["statement", "chandelier", "jhumka", "heavy", "bold", "long"].some(k =>
      style.toLowerCase().includes(k)
    );

    if (isVoluminous) return isDelicate ? 1.0 : isStatement ? 0.6 : 0.8;
    if (isFitted)     return isStatement ? 1.0 : isDelicate ? 0.7 : 0.85;
    return 0.85; // neutral silhouette
  }

  const earringHarmony  = accessoryHarmony(earrings.earringStyle);
  const braceletHarmony = accessoryHarmony(bracelet.braceletStyle);

  // Bonus 0.1 if earring+bracelet styles are in the same category (both delicate or both statement)
  const earringDelicate  = ["delicate", "minimal", "subtle", "small", "stud"].some(k => earrings.earringStyle.toLowerCase().includes(k));
  const braceletDelicate = ["delicate", "minimal", "subtle", "small", "thin"].some(k => bracelet.braceletStyle.toLowerCase().includes(k));
  const styleParity = earringDelicate === braceletDelicate ? 0.1 : 0;

  return Math.min((earringHarmony + braceletHarmony) / 2 + styleParity, 1.0);
}

/**
 * 0–1: how well the look uses the budget without going over.
 * Sweet spot is 70–95% utilization. Going over returns 0.
 */
export function scoreBudget(purchaseTotal: number, budget: number): number {
  if (purchaseTotal > budget) return 0;
  const utilization = purchaseTotal / budget;
  if (utilization >= 0.70 && utilization <= 0.95) return 1.0;
  if (utilization < 0.70) return utilization / 0.70;  // proportional below sweet spot
  // 0.95–1.0: slight taper
  return 1.0 - (utilization - 0.95) / 0.05 * 0.1;
}

/** 0–1: fraction of accessories that list the outfit's type in `compatibleOutfitTypes`. */
export function scoreCoordination(
  outfit: Outfit,
  earrings: Earrings,
  bracelet: Bracelet,
  shoes: Shoes
): number {
  const type = outfit.outfitType;
  let matches = 0;
  if (earrings.compatibleOutfitTypes.includes(type)) matches++;
  if (bracelet.compatibleOutfitTypes.includes(type)) matches++;
  if (shoes.compatibleOutfitTypes.includes(type))    matches++;
  return matches / 3;
}

/** Combine sub-scores with weights into a 0–1 composite. */
export function compositeScore(
  breakdown: ScoreBreakdown,
  weights: ScoringWeights
): number {
  return (
    breakdown.colour       * weights.colour       +
    breakdown.occasion     * weights.occasion     +
    breakdown.style        * weights.style        +
    breakdown.silhouette   * weights.silhouette   +
    breakdown.budget       * weights.budget       +
    breakdown.coordination * weights.coordination
  );
}

// ─── Reason generator ─────────────────────────────────────────────────────────

function buildReason(
  breakdown: ScoreBreakdown,
  outfit: Outfit,
  profile: StylingProfile,
  occasion: string
): string {
  const parts: string[] = [];

  if (breakdown.colour >= 0.85)
    parts.push(`the colour palette complements your ${profile.undertone} undertone beautifully`);
  else if (breakdown.colour >= 0.6)
    parts.push(`most colours work well with your undertone`);

  if (breakdown.occasion >= 0.8)
    parts.push(`every piece is chosen for ${occasion}`);
  else if (breakdown.occasion >= 0.5)
    parts.push(`well suited to ${occasion}`);

  if (breakdown.style >= 0.75)
    parts.push(`accessories match the ${outfit.outfitType.toLowerCase()} aesthetic`);

  if (breakdown.silhouette >= 0.85)
    parts.push(`accessories are in harmony with the silhouette`);

  if (breakdown.budget >= 0.9)
    parts.push(`excellent value for your budget`);
  else if (breakdown.budget >= 0.7)
    parts.push(`fits comfortably within your budget`);

  if (parts.length === 0) return "A coordinated look styled for your profile.";

  const joined = parts.slice(0, 3).join(", ");
  return joined.charAt(0).toUpperCase() + joined.slice(1) + ".";
}

// ─── Selector helpers ─────────────────────────────────────────────────────────

/** Pick the most fitting lipstick: undertone + occasion, deterministic. */
function pickLipstick(
  lipsticks: LipstickShade[],
  occasion: string,
  profile: StylingProfile
): LipstickShade {
  const { undertone } = profile;
  const sorted = [...lipsticks].sort((a, b) => {
    const scoreA =
      (a.undertones.includes(undertone) ? 2 : 0) +
      (a.occasions.includes(occasion)   ? 1 : 0);
    const scoreB =
      (b.undertones.includes(undertone) ? 2 : 0) +
      (b.occasions.includes(occasion)   ? 1 : 0);
    return scoreB - scoreA || a.id.localeCompare(b.id);
  });
  return sorted[0];
}

/** Pick a fitting hairstyle: occasion + style, random among tied top scorers. */
function pickHairstyle(
  hairstyles: Hairstyle[],
  occasion: string,
  style: string
): Hairstyle {
  const scored = hairstyles.map(h => ({
    h,
    score:
      (h.occasions.includes(occasion) ? 2 : 0) +
      (h.styles.includes(style)       ? 1 : 0),
  }));
  const best = Math.max(...scored.map(s => s.score));
  const topTier = scored.filter(s => s.score === best).map(s => s.h);
  return topTier[Math.floor(Math.random() * topTier.length)];
}

/** Pick the most fitting bag: undertone + occasion + compatible outfit type. */
function pickBag(
  bags: Bag[],
  outfitType: OutfitType,
  occasion: string,
  profile: StylingProfile
): Bag {
  const sorted = [...bags].sort((a, b) => {
    const scoreA =
      (a.compatibleOutfitTypes.includes(outfitType)   ? 3 : 0) +
      (a.occasions.includes(occasion)                  ? 2 : 0) +
      (a.undertones.includes(profile.undertone)        ? 1 : 0);
    const scoreB =
      (b.compatibleOutfitTypes.includes(outfitType)   ? 3 : 0) +
      (b.occasions.includes(occasion)                  ? 2 : 0) +
      (b.undertones.includes(profile.undertone)        ? 1 : 0);
    return scoreB - scoreA || a.id.localeCompare(b.id);
  });
  return sorted[0];
}

// ─── Main engine ──────────────────────────────────────────────────────────────

export interface RecommendationInput {
  profile: StylingProfile;
  preferences: UserPreferences;
}

/**
 * Returns exactly 3 ranked looks (fewer only if the catalog has insufficient products).
 * Each look uses a distinct outfit.
 *
 * @param catalogOverride - Inject a custom catalog for unit tests.
 */
export function buildLooks(
  input: RecommendationInput,
  weights: Partial<ScoringWeights> = {},
  catalogOverride?: CatalogSnapshot
): RankedLook[] {
  const w: ScoringWeights = { ...DEFAULT_WEIGHTS, ...weights };
  const { profile, preferences } = input;
  const { occasion, style, outfitType, budgetINR } = preferences;
  const cat = catalogOverride ?? liveCatalog();

  // ── 1. Determine candidate outfits ──────────────────────────────────────

  // Preferred pool: respects outfitType selection (or full catalog for "Surprise Me")
  let preferredOutfits = outfitType === "Surprise Me"
    ? cat.outfits
    : cat.outfits.filter(o => o.outfitType === outfitType as OutfitType);

  // Within preferred pool, bubble up occasion+style matches
  const strictOutfits = preferredOutfits.filter(
    o => o.occasions.includes(occasion) && o.styles.includes(style)
  );
  if (strictOutfits.length >= 3) {
    preferredOutfits = strictOutfits;
  } else if (strictOutfits.length > 0) {
    const strictIds = new Set(strictOutfits.map(o => o.id));
    preferredOutfits = [
      ...strictOutfits,
      ...preferredOutfits.filter(o => !strictIds.has(o.id)),
    ];
  }

  // Supplemental pool: everything else (used only if preferred pool yields < 3 looks)
  const preferredIds = new Set(preferredOutfits.map(o => o.id));
  const supplementalOutfits = cat.outfits.filter(o => !preferredIds.has(o.id));

  // ── 2. Pick best lipstick + hairstyle (constant per run) ────────────────

  if (!cat.lipsticks.length)  throw new Error("Catalog has no lipsticks");
  if (!cat.hairstyles.length) throw new Error("Catalog has no hairstyles");
  if (!cat.bags.length)       throw new Error("Catalog has no bags");

  const bestLipstick  = pickLipstick(cat.lipsticks, occasion, profile);
  const bestHairstyle = pickHairstyle(cat.hairstyles, occasion, style);

  // ── 3. Score best combo per outfit ──────────────────────────────────────

  function scoreOutfitPool(
    pool: Outfit[]
  ): Array<{ outfit: Outfit; look: ScoredCandidate }> {
    const results: Array<{ outfit: Outfit; look: ScoredCandidate }> = [];
    for (const outfit of pool) {
      const compatEarrings  = cat.earrings.filter(e => e.compatibleOutfitTypes.includes(outfit.outfitType));
      const compatBracelets = cat.bracelets.filter(b => b.compatibleOutfitTypes.includes(outfit.outfitType));
      const compatShoes     = cat.shoes.filter(s => s.compatibleOutfitTypes.includes(outfit.outfitType));
      const compatBags      = cat.bags.filter(b => b.compatibleOutfitTypes.includes(outfit.outfitType));

      if (!compatEarrings.length || !compatBracelets.length || !compatShoes.length || !compatBags.length) continue;

      let best: ScoredCandidate | null = null;

      for (const earrings of compatEarrings) {
        for (const bracelet of compatBracelets) {
          for (const shoes of compatShoes) {
            const bestBag = pickBag(compatBags, outfit.outfitType, occasion, profile);
            const purchaseTotal =
              outfit.priceINR + earrings.priceINR + bracelet.priceINR + shoes.priceINR + bestBag.priceINR;

            const breakdown: ScoreBreakdown = {
              colour:       scoreColour(outfit, earrings, bracelet, profile),
              occasion:     scoreOccasion(outfit, earrings, bracelet, shoes, bestLipstick, occasion),
              style:        scoreStyle(outfit, earrings, bracelet, bestHairstyle, style),
              silhouette:   scoreSilhouette(outfit, earrings, bracelet),
              budget:       scoreBudget(purchaseTotal, budgetINR),
              coordination: scoreCoordination(outfit, earrings, bracelet, shoes),
            };
            const score = compositeScore(breakdown, w);

            if (!best || score > best.score) {
              best = { earrings, bracelet, shoes, bag: bestBag, purchaseTotal, breakdown, score };
            }
          }
        }
      }

      if (best) results.push({ outfit, look: best });
    }
    return results;
  }

  // Score preferred pool first
  const preferredRanked = scoreOutfitPool(preferredOutfits);
  preferredRanked.sort((a, b) => b.look.score - a.look.score || a.outfit.id.localeCompare(b.outfit.id));

  const rankedByOutfit = [...preferredRanked];

  // If fewer than 3 looks from the preferred type, supplement from the rest of the catalog
  if (rankedByOutfit.length < 3 && supplementalOutfits.length > 0) {
    const supplementRanked = scoreOutfitPool(supplementalOutfits);
    supplementRanked.sort((a, b) => b.look.score - a.look.score || a.outfit.id.localeCompare(b.outfit.id));
    rankedByOutfit.push(...supplementRanked);
  }

  // ── 4. Take top 3 (distinct outfits) and annotate ────────────────────────

  const top3 = rankedByOutfit.slice(0, 3);

  return top3.map((entry, i) => {
    const { outfit, look } = entry;
    const rank = (i + 1) as 1 | 2 | 3;
    const totalPriceINR = look.purchaseTotal; // lipstick + hairstyle priceINR not counted in budget

    return {
      id:    `look-${rank}-${outfit.id}`,
      name:  `Look ${rank}: ${outfit.name}`,
      occasion,
      outfit,
      earrings:  look.earrings,
      bracelet:  look.bracelet,
      shoes:     look.shoes,
      bag:       look.bag,
      lipstick:  bestLipstick,
      hairstyle: bestHairstyle,
      totalPriceINR,
      overBudget: totalPriceINR > budgetINR,
      score:          look.score,
      scoreBreakdown: look.breakdown,
      reason: buildReason(look.breakdown, outfit, profile, occasion),
      rank,
    } satisfies RankedLook;
  });
}

// ─── Internal type ────────────────────────────────────────────────────────────

interface ScoredCandidate {
  earrings:     Earrings;
  bracelet:     Bracelet;
  shoes:        Shoes;
  bag:          Bag;
  purchaseTotal: number;
  breakdown:    ScoreBreakdown;
  score:        number;
}

