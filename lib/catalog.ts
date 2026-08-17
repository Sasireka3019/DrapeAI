import type {
  CatalogData,
  Outfit,
  Earrings,
  Bracelet,
  Shoes,
  Necklace,
  Bag,
  LipstickShade,
  Hairstyle,
  Undertone,
  OutfitType,
} from "@/types/catalog";
import rawCatalog from "@/data/catalog.json";

const catalog = rawCatalog as CatalogData;

// ─── Accessors ────────────────────────────────────────────────────────────────

export const getOutfits   = (): Outfit[]       => catalog.outfits;
export const getEarrings  = (): Earrings[]     => catalog.earrings;
export const getBracelets = (): Bracelet[]     => catalog.bracelets;
export const getShoes     = (): Shoes[]        => catalog.shoes;
export const getNecklaces = (): Necklace[]     => catalog.necklaces;
export const getBags      = (): Bag[]          => catalog.bags;
export const getLipsticks = (): LipstickShade[] => catalog.lipsticks;
export const getHairstyles = (): Hairstyle[]   => catalog.hairstyles;

// ─── Filters ──────────────────────────────────────────────────────────────────

export function filterOutfitsByType(outfitType: string): Outfit[] {
  if (outfitType === "Surprise Me") return catalog.outfits;
  return catalog.outfits.filter(o => o.outfitType === outfitType);
}

export function filterByOccasion<T extends { occasions: string[] }>(
  items: T[],
  occasion: string
): T[] {
  return items.filter(i => i.occasions.includes(occasion));
}

export function filterByStyle<T extends { styles: string[] }>(
  items: T[],
  style: string
): T[] {
  return items.filter(i => i.styles.includes(style));
}

export function filterByUndertone<T extends { undertones: Undertone[] }>(
  items: T[],
  undertone: Undertone
): T[] {
  return items.filter(i => i.undertones.includes(undertone));
}

export function filterByBudget<T extends { priceINR: number }>(
  items: T[],
  maxBudget: number
): T[] {
  return items.filter(i => i.priceINR <= maxBudget);
}

export function filterByCompatibleOutfitType<T extends { compatibleOutfitTypes: OutfitType[] }>(
  items: T[],
  outfitType: OutfitType
): T[] {
  return items.filter(i => i.compatibleOutfitTypes.includes(outfitType));
}

// ─── Lookup ───────────────────────────────────────────────────────────────────

export function getOutfitById(id: string): Outfit | undefined {
  return catalog.outfits.find(o => o.id === id);
}

export function getHairstyleByOccasionAndStyle(
  occasion: string,
  style: string
): Hairstyle {
  const match =
    catalog.hairstyles.find(
      h => h.occasions.includes(occasion) && h.styles.includes(style)
    ) ??
    catalog.hairstyles.find(h => h.occasions.includes(occasion)) ??
    catalog.hairstyles[0];
  return match;
}

// ─── Budget scoring ───────────────────────────────────────────────────────────

/** Returns items sorted by how close they are to targetBudget (ascending diff). */
export function sortByBudgetProximity<T extends { priceINR: number }>(
  items: T[],
  targetBudget: number
): T[] {
  return [...items].sort(
    (a, b) =>
      Math.abs(a.priceINR - targetBudget) - Math.abs(b.priceINR - targetBudget)
  );
}

/** Returns how much of the budget a look consumes (0–1). */
export function budgetUtilization(totalPrice: number, budget: number): number {
  return Math.min(totalPrice / budget, 1);
}
