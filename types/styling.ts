import type { Undertone } from "@/types/catalog";

export type { Undertone };

export type SkinTone = "fair" | "light" | "medium" | "tan" | "deep" | "rich";

export interface ColourSwatch {
  name: string;
  hex: string;
}

export interface RawYouCamColors {
  skinColor: string;
  eyeColor?: string;
  eyeColorName?: string;
  lipColor?: string;
  hairColor?: string;
  hairColorName?: string;
}

export interface StylingProfile {
  skinTone: SkinTone;
  skinToneLabel: string;
  skinColourHex: string;
  undertone: Undertone;
  colourPalette: ColourSwatch[];
  stylingNote: string;
  rawColors?: RawYouCamColors;
  fitzpatrickType?: string;   // e.g. "Type III"
  fitzpatrickDescription?: string;
  /** "analyzed" = YouCam returned real data; "estimated" = fell back to heuristics */
  source: "analyzed" | "estimated";
}

export interface UserPreferences {
  occasion: string;
  style: string;
  outfitType: string;
  budgetINR: number;
}

