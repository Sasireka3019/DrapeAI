export type Undertone = "warm" | "cool" | "neutral";
export type ProductCategory =
  | "outfit"
  | "earrings"
  | "bracelet"
  | "shoes"
  | "necklace"
  | "bag"
  | "lipstick"
  | "hairstyle";

export type OutfitType = "Gown" | "Dress" | "Midi" | "CoordSet" | "Mini";

// ─── Outfit ──────────────────────────────────────────────────────────────────

export interface Outfit {
  id: string;
  category: "outfit";
  name: string;
  outfitType: OutfitType;
  description: string;
  colour: string;
  colourHex: string;
  priceINR: number;
  image: string;
  /** Clean product/garment shot used as ref_file_url for YouCam VTO */
  garmentImageUrl: string;
  purchaseUrl?: string;
  occasions: string[];
  styles: string[];
  undertones: Undertone[];
  silhouetteTags: string[];
}

// ─── Earrings ─────────────────────────────────────────────────────────────────

export interface Earrings {
  id: string;
  category: "earrings";
  name: string;
  colour: string;
  colourHex: string;
  priceINR: number;
  image: string;
  purchaseUrl?: string;
  material: string;
  earringStyle: string;
  occasions: string[];
  styles: string[];
  undertones: Undertone[];
  compatibleOutfitTypes: OutfitType[];
}

// ─── Bracelet ─────────────────────────────────────────────────────────────────

export interface Bracelet {
  id: string;
  category: "bracelet";
  name: string;
  colour: string;
  colourHex: string;
  priceINR: number;
  image: string;
  purchaseUrl?: string;
  material: string;
  braceletStyle: string;
  occasions: string[];
  styles: string[];
  undertones: Undertone[];
  compatibleOutfitTypes: OutfitType[];
}

// ─── Shoes ────────────────────────────────────────────────────────────────────

export interface Shoes {
  id: string;
  category: "shoes";
  name: string;
  colour: string;
  colourHex: string;
  priceINR: number;
  image: string;
  purchaseUrl?: string;
  heelHeight: "flat" | "low" | "mid" | "high";
  shoeStyle: string;
  occasions: string[];
  styles: string[];
  compatibleOutfitTypes: OutfitType[];
}

// ─── Lipstick ─────────────────────────────────────────────────────────────────

export interface LipstickShade {
  id: string;
  category: "lipstick";
  name: string;
  shadeName: string;
  hexCode: string;
  priceINR: number;
  image: string;
  purchaseUrl?: string;
  finish: "matte" | "glossy" | "satin" | "sheer";
  undertones: Undertone[];
  occasions: string[];
}

// ─── Necklace ────────────────────────────────────────────────────────────────

export interface Necklace {
  id: string;
  category: "necklace";
  name: string;
  colour: string;
  colourHex: string;
  priceINR: number;
  image: string;
  /** Clean product shot for YouCam Necklace VTO */
  necklaceImageUrl: string;
  purchaseUrl?: string;
  material: string;
  necklaceStyle: string;
  occasions: string[];
  styles: string[];
  undertones: Undertone[];
  compatibleOutfitTypes: OutfitType[];
}

// ─── Hairstyle ────────────────────────────────────────────────────────────────

export interface Hairstyle {
  id: string;
  category: "hairstyle";
  name: string;
  description: string;
  image: string;
  /** YouCam AI Hair Style preset ID for the VTO API */
  youcamStyleId?: string;
  occasions: string[];
  styles: string[];
  priceINR: 0;
}

// ─── Bag ─────────────────────────────────────────────────────────────────────

export interface Bag {
  id: string;
  category: "bag";
  name: string;
  colour: string;
  colourHex: string;
  priceINR: number;
  image: string;
  /** Clean product shot for YouCam Bag VTO */
  bagImageUrl: string;
  purchaseUrl?: string;
  material: string;
  bagStyle: string;
  occasions: string[];
  styles: string[];
  undertones: Undertone[];
  compatibleOutfitTypes: OutfitType[];
}

// ─── Union ────────────────────────────────────────────────────────────────────

export type Product = Outfit | Earrings | Bracelet | Shoes | Necklace | Bag | LipstickShade | Hairstyle;

// ─── Look ─────────────────────────────────────────────────────────────────────

export interface Look {
  id: string;
  name: string;
  occasion: string;
  outfit: Outfit;
  earrings: Earrings;
  bracelet: Bracelet;
  shoes: Shoes;
  bag: Bag;
  lipstick: LipstickShade;
  hairstyle: Hairstyle;
  /** Sum of outfit + earrings + bracelet + shoes + bag (lipstick + hairstyle are styling-only). */
  totalPriceINR: number;
}

export interface ScoreBreakdown {
  colour: number;
  occasion: number;
  style: number;
  silhouette: number;
  budget: number;
  coordination: number;
}

export interface RankedLook extends Look {
  /** Composite score 0–1. */
  score: number;
  scoreBreakdown: ScoreBreakdown;
  reason: string;
  rank: 1 | 2 | 3;
  /** True when totalPriceINR exceeds the user's chosen budget. */
  overBudget: boolean;
}

// ─── Catalog shape (matches catalog.json) ────────────────────────────────────

export interface CatalogData {
  outfits: Outfit[];
  earrings: Earrings[];
  bracelets: Bracelet[];
  shoes: Shoes[];
  necklaces: Necklace[];
  bags: Bag[];
  lipsticks: LipstickShade[];
  hairstyles: Hairstyle[];
}

