// Server-only. Never import this in client components.
import type { StylingProfile, SkinTone, ColourSwatch, RawYouCamColors } from "@/types/styling";
import type { Undertone } from "@/types/catalog";
import type { YouCamSkinColors } from "@/lib/youcam-client";

// ─── Colour utilities ─────────────────────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "").padEnd(6, "0");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function luminance({ r, g, b }: { r: number; g: number; b: number }): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// ─── Fitzpatrick skin type from luminance ────────────────────────────────────

const FITZPATRICK: Array<{ type: string; description: string; maxLum: number }> = [
  { type: "Type I",   description: "Very fair — always burns, never tans",     maxLum: 230 },
  { type: "Type II",  description: "Fair — usually burns, tans minimally",     maxLum: 200 },
  { type: "Type III", description: "Medium — sometimes burns, tans gradually", maxLum: 165 },
  { type: "Type IV",  description: "Olive — rarely burns, tans easily",        maxLum: 125 },
  { type: "Type V",   description: "Brown — very rarely burns, tans very easily", maxLum: 85 },
  { type: "Type VI",  description: "Deep brown/Black — never burns, always tans", maxLum: 0 },
];

export function fitzpatrickFromHex(hex: string): { type: string; description: string } {
  const lum = luminance(hexToRgb(hex));
  return FITZPATRICK.find(f => lum > f.maxLum) ?? FITZPATRICK[FITZPATRICK.length - 1];
}

// ─── Skin tone label from luminance ──────────────────────────────────────────

export function skinToneLabelFromHex(hex: string): SkinTone {
  const lum = luminance(hexToRgb(hex));
  if (lum > 210) return "fair";
  if (lum > 175) return "light";
  if (lum > 140) return "medium";
  if (lum > 105) return "tan";
  if (lum > 65)  return "deep";
  return "rich";
}

const skinToneDisplayNames: Record<SkinTone, string> = {
  fair:   "Fair",
  light:  "Light",
  medium: "Medium",
  tan:    "Warm Tan",
  deep:   "Deep",
  rich:   "Rich",
};

// ─── Undertone from skin colour hex ──────────────────────────────────────────

export function deriveUndertone(skinHex: string): Undertone {
  const { r, g, b } = hexToRgb(skinHex);
  // Warm: strong red/yellow bias (R well above B, G moderately above B)
  // Cool: pink/blue cast (R close to B, or pinkish hue)
  const warmBias  = r - b;
  const pinkBias  = r - g;

  if (warmBias > 45 && pinkBias < 35) return "warm";
  if (warmBias < 20 || (pinkBias > 40 && warmBias < 35)) return "cool";
  return "neutral";
}

// ─── Colour palettes ──────────────────────────────────────────────────────────

const PALETTES: Record<Undertone, ColourSwatch[]> = {
  warm: [
    { name: "Terracotta",   hex: "#C05E3C" },
    { name: "Mustard",      hex: "#C9A227" },
    { name: "Rust",         hex: "#B44B2A" },
    { name: "Olive",        hex: "#7A8B4F" },
    { name: "Gold",         hex: "#C9A84C" },
    { name: "Caramel",      hex: "#A0724A" },
    { name: "Warm Red",     hex: "#C0392B" },
  ],
  cool: [
    { name: "Emerald",      hex: "#1A5C3A" },
    { name: "Maroon",       hex: "#6B1A2A" },
    { name: "Royal Blue",   hex: "#2D5CA8" },
    { name: "Berry",        hex: "#7B2D8B" },
    { name: "Slate Blue",   hex: "#5C7A9B" },
    { name: "Dusty Rose",   hex: "#B07A8A" },
    { name: "Navy",         hex: "#1E3A5F" },
  ],
  neutral: [
    { name: "Sage Green",   hex: "#7A9E7E" },
    { name: "Burgundy",     hex: "#7B2438" },
    { name: "Teal",         hex: "#2A6B7C" },
    { name: "Blush",        hex: "#D4908A" },
    { name: "Soft Gold",    hex: "#C9A84C" },
    { name: "Charcoal",     hex: "#3D3D3D" },
    { name: "Ivory",        hex: "#FAF8F5" },
  ],
};

// ─── Styling note ─────────────────────────────────────────────────────────────

function buildStylingNote(
  skinTone: SkinTone,
  undertone: Undertone,
  hairColorName?: string
): string {
  const undertoneText =
    undertone === "warm"  ? "warm golden" :
    undertone === "cool"  ? "cool rosy"   : "balanced neutral";

  const hairNote = hairColorName
    ? ` Your ${hairColorName.toLowerCase()} hair works beautifully with rich, saturated shades.`
    : "";

  return (
    `Your ${skinToneDisplayNames[skinTone].toLowerCase()} complexion carries ${undertoneText} ` +
    `undertones, which means the colours in your palette will look naturally vibrant on you.` +
    hairNote +
    ` This is your signature palette — it works across seasons and occasions.`
  );
}

// ─── Public builders ──────────────────────────────────────────────────────────

export function buildProfileFromYouCamColors(
  colors: YouCamSkinColors
): StylingProfile {
  const skinTone = skinToneLabelFromHex(colors.skin_color);
  const undertone = deriveUndertone(colors.skin_color);
  const fitzpatrick = fitzpatrickFromHex(colors.skin_color);

  const rawColors: RawYouCamColors = {
    skinColor:     colors.skin_color,
    eyeColor:      colors.eye_color,
    eyeColorName:  colors.eye_color_name,
    lipColor:      colors.lip_color,
    hairColor:     colors.hair_color,
    hairColorName: colors.hair_color_name,
  };

  return {
    skinTone,
    skinToneLabel: skinToneDisplayNames[skinTone],
    skinColourHex: colors.skin_color,
    undertone,
    colourPalette: PALETTES[undertone],
    stylingNote:   buildStylingNote(skinTone, undertone, colors.hair_color_name),
    rawColors,
    fitzpatrickType:        fitzpatrick.type,
    fitzpatrickDescription: fitzpatrick.description,
    source: "analyzed",
  };
}

/** Fallback when analysis cannot be performed (e.g. full-body photo, no face). */
export function buildEstimatedProfile(): StylingProfile {
  const fitzpatrick = fitzpatrickFromHex("#C4956A");
  return {
    skinTone:      "medium",
    skinToneLabel: "Medium",
    skinColourHex: "#C4956A",
    undertone:     "warm",
    colourPalette: PALETTES.warm,
    stylingNote:
      "We weren't able to detect your skin tone from this photo (it works best with a close-up face shot). " +
      "These warm tones are a great starting point — you can adjust your palette on the next screen.",
    fitzpatrickType:        fitzpatrick.type,
    fitzpatrickDescription: fitzpatrick.description,
    source: "estimated",
  };
}
