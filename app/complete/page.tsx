"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { RankedLook } from "@/types/catalog";
import { formatINR } from "@/lib/utils";

const cx: React.CSSProperties = {
  width: "100%",
  maxWidth: "72rem",
  marginLeft: "auto",
  marginRight: "auto",
  paddingLeft: "clamp(1.5rem, 4vw, 4rem)",
  paddingRight: "clamp(1.5rem, 4vw, 4rem)",
};

// ─── Accessory category definitions ──────────────────────────────────────────

const CATEGORIES = [
  { key: "hairstyle", icon: "💇", label: "Hairstyle",       purchasable: false },
  { key: "lipstick",  icon: "💄", label: "Lip Colour",      purchasable: true  },
  { key: "earrings",  icon: "💎", label: "Earrings",        purchasable: true  },
  { key: "bracelet",  icon: "💍", label: "Bracelet / Bangles", purchasable: true },
  { key: "shoes",     icon: "👠", label: "Shoes",           purchasable: true  },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]["key"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CompletePage() {
  const router = useRouter();
  const [look, setLook]         = useState<RankedLook | null>(null);
  const [tryOnUrl, setTryOnUrl] = useState<string | null>(null);
  const [ready, setReady]       = useState(false);

  useEffect(() => {
    const rawLook  = sessionStorage.getItem("drape_selected_look");
    const storedTryOn = sessionStorage.getItem("drape_final_look_url") ?? sessionStorage.getItem("drape_tryon_url");

    if (!rawLook) {
      router.replace("/looks");
      return;
    }

    try {
      setLook(JSON.parse(rawLook));
      setTryOnUrl(storedTryOn);
      setReady(true);
    } catch {
      router.replace("/looks");
    }
  }, [router]);

  if (!ready || !look) return null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-ivory)" }}>
      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        backgroundColor: "rgba(250,248,245,0.95)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--color-border)",
      }}>
        <div style={{ ...cx, maxWidth: "72rem", height: "4rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" className="font-serif" style={{ fontSize: "1.125rem", color: "var(--color-charcoal)", textDecoration: "none" }}>
            Drape
          </Link>
          <span className="eyebrow">Complete My Look</span>
          <Link href="/tryon" style={{ fontSize: "0.75rem", color: "var(--color-slate)", textDecoration: "none", letterSpacing: "0.08em" }}>
            ← Try-On
          </Link>
        </div>
      </header>

      <main style={{ padding: "3rem 0 7rem" }}>
        <div style={cx}>
          <div className="animate-fade-up">

            {/* ── Hero anchor ───────────────────────────────────────── */}
            <AnchorHero look={look} tryOnUrl={tryOnUrl} />

            {/* ── Section heading ───────────────────────────────────── */}
            <div style={{ margin: "3rem 0 2rem", textAlign: "center" }}>
              <p className="eyebrow" style={{ marginBottom: "0.5rem" }}>Styled to match</p>
              <h2 className="font-serif" style={{
                fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                fontWeight: 400, color: "var(--color-charcoal)", lineHeight: 1.1,
              }}>
                Every detail, chosen for you.
              </h2>
              <p style={{ fontSize: "0.875rem", color: "var(--color-slate)", marginTop: "0.625rem", fontWeight: 300 }}>
                Each piece was selected to coordinate with your outfit, colour profile, and occasion.
              </p>
            </div>

            {/* Gold rule */}
            <div className="gold-rule" style={{ marginBottom: "3rem" }} />

            {/* ── Category tiles ────────────────────────────────────── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
              {CATEGORIES.map(cat => (
                <CategorySection key={cat.key} category={cat} look={look} />
              ))}
            </div>

            {/* ── CTA to Summary ────────────────────────────────────── */}
            <div style={{ marginTop: "4rem", textAlign: "center" }}>
              <div className="gold-rule" style={{ marginBottom: "2.5rem" }} />
              <p className="eyebrow" style={{ marginBottom: "0.75rem" }}>Your look is ready</p>
              <h3 className="font-serif" style={{
                fontSize: "clamp(1.25rem, 2.5vw, 1.875rem)",
                fontWeight: 400, color: "var(--color-charcoal)",
                marginBottom: "0.5rem",
              }}>
                Drape&rsquo;s Pick: <em>{look.outfit.name}</em>
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--color-slate)", marginBottom: "2rem", fontWeight: 300 }}>
                {formatINR(look.totalPriceINR)} · {Math.round(look.score * 100)}% match for your profile
              </p>
              <Link
                href="/summary"
                onClick={() => sessionStorage.setItem("drape_tryon_url", tryOnUrl ?? "")}
                style={{
                  display: "inline-block",
                  background: "var(--color-charcoal)", color: "#fff",
                  padding: "1rem 2.75rem",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.6875rem", fontWeight: 500,
                  letterSpacing: "0.18em", textTransform: "uppercase",
                  textDecoration: "none",
                }}
              >
                See Drape&rsquo;s Pick →
              </Link>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Anchor hero ──────────────────────────────────────────────────────────────

function AnchorHero({ look, tryOnUrl }: { look: RankedLook; tryOnUrl: string | null }) {
  const displayImage = tryOnUrl ?? look.outfit.image;

  return (
    <div style={{
      border: "1px solid var(--color-border)",
      background: "#fff",
      padding: "1.5rem",
    }}>
      <div className="layout-anchor-hero">
      {/* Image */}
      <div style={{ position: "relative", overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={displayImage}
          alt={look.outfit.name}
          style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }}
        />
        {tryOnUrl && (
          <div style={{
            position: "absolute", bottom: "0.5rem", left: "0.5rem",
            background: "rgba(201,168,76,0.9)",
            padding: "0.25rem 0.6rem",
            fontSize: "0.5625rem", fontWeight: 600,
            letterSpacing: "0.1em", textTransform: "uppercase", color: "#fff",
          }}>
            Try-On
          </div>
        )}
      </div>

      {/* Details */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: "0.4rem" }}>Your anchor piece</p>
          <h2 className="font-serif" style={{
            fontSize: "clamp(1.125rem, 2.5vw, 1.75rem)",
            fontWeight: 400, color: "var(--color-charcoal)", lineHeight: 1.2, marginBottom: "0.25rem",
          }}>
            {look.outfit.name}
          </h2>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-slate)" }}>
            {look.outfit.outfitType} · {look.outfit.colour}
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-slate)", marginTop: "0.2rem" }}>
            {look.outfit.description}
          </p>
        </div>

        {/* Score */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
            <span style={{ fontSize: "0.6875rem", color: "var(--color-slate)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Profile match
            </span>
            <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--color-charcoal)" }}>
              {Math.round(look.score * 100)}%
            </span>
          </div>
          <div style={{ height: "4px", background: "var(--color-border)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${look.score * 100}%`, background: "var(--color-gold)" }} />
          </div>
        </div>

        {/* Price */}
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          <PriceLine label="Outfit" amount={look.outfit.priceINR} />
          <PriceLine label="Earrings" amount={look.earrings.priceINR} />
          <PriceLine label="Bracelet" amount={look.bracelet.priceINR} />
          <PriceLine label="Shoes" amount={look.shoes.priceINR} />
        </div>
        <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "0.75rem" }}>
          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-charcoal)" }}>
            {formatINR(look.totalPriceINR)}
            <span style={{ fontWeight: 300, color: "var(--color-slate)", fontSize: "0.75rem", marginLeft: "0.4rem" }}>
              complete look
            </span>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}

function PriceLine({ label, amount }: { label: string; amount: number }) {
  return (
    <div>
      <p style={{ fontSize: "0.6875rem", color: "var(--color-slate)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.15rem" }}>
        {label}
      </p>
      <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-charcoal)" }}>
        {formatINR(amount)}
      </p>
    </div>
  );
}

// ─── Category section ─────────────────────────────────────────────────────────

function CategorySection({
  category,
  look,
}: {
  category: (typeof CATEGORIES)[number];
  look: RankedLook;
}) {
  const item = getItemForCategory(category.key, look);
  const reason = buildReason(category.key, look);

  return (
    <div>
      {/* Category heading */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <span style={{ fontSize: "1.5rem" }}>{category.icon}</span>
        <h3 className="font-serif" style={{ fontSize: "1.125rem", fontWeight: 400, color: "var(--color-charcoal)" }}>
          {category.label}
        </h3>
        <div style={{ flex: 1, height: "1px", background: "var(--color-border)" }} />
        {!category.purchasable && (
          <span style={{
            fontSize: "0.5625rem", fontWeight: 600, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "var(--color-slate)",
            padding: "0.2rem 0.5rem", border: "1px solid var(--color-border)",
          }}>
            Styling service
          </span>
        )}
      </div>

      {/* Item card */}
      <ItemCard item={item} reason={reason} purchasable={category.purchasable} />
    </div>
  );
}

// ─── Item card ────────────────────────────────────────────────────────────────

type ItemSummary = {
  name: string;
  subtitle: string;
  image: string;
  colourHex?: string;
  priceINR?: number;
};

function ItemCard({
  item,
  reason,
  purchasable,
}: {
  item: ItemSummary;
  reason: string;
  purchasable: boolean;
}) {
  const [whyOpen, setWhyOpen] = useState(false);

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "clamp(6rem, 18%, 9rem) 1fr",
      border: "1px solid var(--color-border)",
      background: "#fff",
      overflow: "hidden",
    }}>
      {/* Image */}
      <div style={{ background: "var(--color-ivory-dark)", position: "relative" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image}
          alt={item.name}
          style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", display: "block" }}
        />
        {item.colourHex && (
          <div style={{
            position: "absolute", bottom: "0.4rem", right: "0.4rem",
            width: "1.25rem", height: "1.25rem", borderRadius: "50%",
            background: item.colourHex, border: "2px solid #fff",
            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          }} />
        )}
      </div>

      {/* Details */}
      <div style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem" }}>
          <div>
            <p className="font-serif" style={{ fontSize: "1rem", fontWeight: 400, color: "var(--color-charcoal)", lineHeight: 1.25 }}>
              {item.name}
            </p>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-slate)", marginTop: "0.2rem" }}>
              {item.subtitle}
            </p>
          </div>
          {purchasable && item.priceINR != null && item.priceINR > 0 ? (
            <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-charcoal)", flexShrink: 0 }}>
              {formatINR(item.priceINR)}
            </p>
          ) : !purchasable ? (
            <p style={{ fontSize: "0.75rem", color: "var(--color-slate)", flexShrink: 0, fontStyle: "italic" }}>
              Complimentary
            </p>
          ) : null}
        </div>

        {/* Why this? toggle */}
        <button
          onClick={() => setWhyOpen(v => !v)}
          style={{
            alignSelf: "flex-start",
            background: "none", border: "none", padding: 0,
            fontFamily: "var(--font-sans)",
            fontSize: "0.6875rem", fontWeight: 500,
            letterSpacing: "0.1em", textTransform: "uppercase",
            color: "var(--color-gold)",
            cursor: "pointer",
          }}
          aria-expanded={whyOpen}
        >
          {whyOpen ? "Hide ↑" : "Why this? ↓"}
        </button>

        {/* Reason panel */}
        {whyOpen && (
          <div style={{
            padding: "0.75rem 1rem",
            background: "var(--color-ivory)",
            border: "1px solid var(--color-border)",
            borderLeft: "3px solid var(--color-gold)",
            fontSize: "0.875rem", color: "var(--color-charcoal)",
            lineHeight: 1.65, fontWeight: 300,
          }}>
            {reason}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

function getItemForCategory(key: CategoryKey, look: RankedLook): ItemSummary {
  switch (key) {
    case "hairstyle":
      return {
        name:     look.hairstyle.name,
        subtitle: look.hairstyle.description,
        image:    look.hairstyle.image,
        priceINR: look.hairstyle.priceINR,
      };
    case "lipstick":
      return {
        name:      look.lipstick.shadeName,
        subtitle:  `${look.lipstick.finish.charAt(0).toUpperCase() + look.lipstick.finish.slice(1)} finish · ${look.lipstick.name}`,
        image:     look.lipstick.image,
        colourHex: look.lipstick.hexCode,
        priceINR:  look.lipstick.priceINR,
      };
    case "earrings":
      return {
        name:      look.earrings.name,
        subtitle:  `${look.earrings.earringStyle} · ${look.earrings.material}`,
        image:     look.earrings.image,
        colourHex: look.earrings.colourHex,
        priceINR:  look.earrings.priceINR,
      };
    case "bracelet":
      return {
        name:      look.bracelet.name,
        subtitle:  `${look.bracelet.braceletStyle} · ${look.bracelet.material}`,
        image:     look.bracelet.image,
        colourHex: look.bracelet.colourHex,
        priceINR:  look.bracelet.priceINR,
      };
    case "shoes":
      return {
        name:      look.shoes.name,
        subtitle:  `${look.shoes.shoeStyle} · ${look.shoes.heelHeight} heel`,
        image:     look.shoes.image,
        colourHex: look.shoes.colourHex,
        priceINR:  look.shoes.priceINR,
      };
  }
}

function buildReason(key: CategoryKey, look: RankedLook): string {
  const outfit    = look.outfit;
  const undertone = look.scoreBreakdown.colour > 0.7 ? "warm" : look.scoreBreakdown.colour > 0.4 ? "neutral" : "cool";
  const occasion  = look.occasion;

  switch (key) {
    case "hairstyle": {
      const h = look.hairstyle;
      return `The ${h.name.toLowerCase()} frames your face elegantly and works beautifully with the ${outfit.outfitType.toLowerCase()}'s neckline. It's well-suited for ${occasion.toLowerCase()} occasions and complements the ${outfit.colour.toLowerCase()} palette.`;
    }
    case "lipstick": {
      const l = look.lipstick;
      return `${l.shadeName} in ${l.finish} finish coordinates with the ${undertone} undertones in your profile. A ${l.finish} lip adds the right level of definition for a ${occasion.toLowerCase()} look without overpowering the ${outfit.colour.toLowerCase()} outfit.`;
    }
    case "earrings": {
      const e = look.earrings;
      return `${e.name} in ${e.colour.toLowerCase()} complements the ${outfit.colour.toLowerCase()} ${outfit.outfitType.toLowerCase()}'s colour palette. The ${e.earringStyle.toLowerCase()} silhouette is specifically chosen to work with the outfit's neckline and drape for a ${occasion.toLowerCase()} setting.`;
    }
    case "bracelet": {
      const b = look.bracelet;
      return `${b.name} in ${b.colour.toLowerCase()} echoes the metallic tones in your earring selection, creating a cohesive arm stack. The ${b.braceletStyle.toLowerCase()} style pairs naturally with the ${outfit.outfitType.toLowerCase()} for ${occasion.toLowerCase()}.`;
    }
    case "shoes": {
      const s = look.shoes;
      return `${s.name} anchors the look with a ${s.heelHeight}-heel ${s.shoeStyle.toLowerCase()} that balances the ${outfit.outfitType.toLowerCase()}'s silhouette. The ${s.colour.toLowerCase()} tone ties back to the ${outfit.colour.toLowerCase()} palette for a polished ${occasion.toLowerCase()} finish.`;
    }
  }
}

