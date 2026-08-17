"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { RankedLook } from "@/types/catalog";
import type { UserPreferences } from "@/types/styling";
import { formatINR } from "@/lib/utils";

const cx: React.CSSProperties = {
  width: "100%",
  maxWidth: "56rem",
  marginLeft: "auto",
  marginRight: "auto",
  paddingLeft: "clamp(1.5rem, 4vw, 4rem)",
  paddingRight: "clamp(1.5rem, 4vw, 4rem)",
};

export default function SummaryPage() {
  const router = useRouter();
  const [look, setLook]               = useState<RankedLook | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [tryOnUrl, setTryOnUrl]       = useState<string | null>(null);
  const [ready, setReady]             = useState(false);

  useEffect(() => {
    const rawLook  = sessionStorage.getItem("drape_selected_look");
    const rawPrefs = sessionStorage.getItem("drape_preferences");
    const storedTryOn = sessionStorage.getItem("drape_tryon_url");

    if (!rawLook || !rawPrefs) { router.replace("/looks"); return; }

    try {
      setLook(JSON.parse(rawLook));
      setPreferences(JSON.parse(rawPrefs));
      setTryOnUrl(storedTryOn);
      setReady(true);
    } catch { router.replace("/looks"); }
  }, [router]);

  if (!ready || !look || !preferences) return null;

  const budget    = preferences.budgetINR;
  const spent     = look.totalPriceINR;
  const remaining = budget - spent;
  const withinBudget = remaining >= 0;
  const utilPct   = Math.min(spent / budget, 1);

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
          <span className="eyebrow">Drape&rsquo;s Pick</span>
          <Link href="/complete" style={{ fontSize: "0.75rem", color: "var(--color-slate)", textDecoration: "none", letterSpacing: "0.08em" }}>
            ← Complete Look
          </Link>
        </div>
      </header>

      <main style={{ padding: "3.5rem 0 7rem" }}>
        <div style={cx}>
          <div className="animate-fade-up" style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>

            {/* ── Drape's Pick hero ──────────────────────────────────── */}
            <PickHero look={look} tryOnUrl={tryOnUrl} />

            {/* ── Budget summary ─────────────────────────────────────── */}
            <BudgetCard look={look} budget={budget} spent={spent} remaining={remaining} withinBudget={withinBudget} utilPct={utilPct} />

            {/* ── Why it's the best match ────────────────────────────── */}
            <WhyBestMatch look={look} preferences={preferences} />

            {/* ── Actions ───────────────────────────────────────────── */}
            <ActionStrip look={look} />

          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Pick hero ────────────────────────────────────────────────────────────────

function PickHero({ look, tryOnUrl }: { look: RankedLook; tryOnUrl: string | null }) {
  return (
    <div style={{ textAlign: "center" }}>
      <p className="eyebrow" style={{ marginBottom: "0.5rem" }}>Drape&rsquo;s Pick</p>
      <h1 className="font-serif" style={{
        fontSize: "clamp(2rem, 5vw, 3.25rem)",
        fontWeight: 400, lineHeight: 1.05,
        color: "var(--color-charcoal)",
        marginBottom: "0.75rem",
      }}>
        {look.outfit.name}
      </h1>
      <p style={{ fontSize: "0.875rem", color: "var(--color-slate)", fontWeight: 300, marginBottom: "2rem" }}>
        {look.outfit.outfitType} · {look.outfit.colour} · {Math.round(look.score * 100)}% profile match
      </p>

      {/* Hero image */}
      <div style={{
        position: "relative", display: "inline-block",
        maxWidth: "22rem", width: "100%",
        boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={tryOnUrl ?? look.outfit.image}
          alt={look.outfit.name}
          style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }}
        />
        {/* Gold medal badge */}
        <div style={{
          position: "absolute", top: "1rem", left: "1rem",
          background: "var(--color-gold)", color: "#fff",
          padding: "0.4rem 0.875rem",
          fontFamily: "var(--font-sans)",
          fontSize: "0.5625rem", fontWeight: 700,
          letterSpacing: "0.14em", textTransform: "uppercase",
        }}>
          🥇 Best Match
        </div>
        {tryOnUrl && (
          <div style={{
            position: "absolute", bottom: "1rem", right: "1rem",
            background: "rgba(26,26,26,0.75)",
            padding: "0.3rem 0.6rem",
            fontSize: "0.5625rem", fontWeight: 600,
            letterSpacing: "0.1em", textTransform: "uppercase", color: "#fff",
            backdropFilter: "blur(4px)",
          }}>
            Try-On Result
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Budget card ──────────────────────────────────────────────────────────────

function BudgetCard({
  look, budget, spent, remaining, withinBudget, utilPct,
}: {
  look: RankedLook;
  budget: number;
  spent: number;
  remaining: number;
  withinBudget: boolean;
  utilPct: number;
}) {
  const lineItems = [
    { label: "Outfit",   amount: look.outfit.priceINR   },
    { label: "Earrings", amount: look.earrings.priceINR },
    { label: "Bracelet", amount: look.bracelet.priceINR },
    { label: "Shoes",    amount: look.shoes.priceINR    },
  ];

  return (
    <div style={{ border: "1px solid var(--color-border)", background: "#fff" }}>
      {/* Heading strip */}
      <div style={{
        padding: "0.75rem 1.5rem",
        borderBottom: "1px solid var(--color-border)",
        background: "var(--color-ivory-dark)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <p className="eyebrow">Budget summary</p>
        <span style={{
          fontSize: "0.6875rem", fontWeight: 600,
          letterSpacing: "0.08em", textTransform: "uppercase",
          color: withinBudget ? "#166534" : "#991B1B",
        }}>
          {withinBudget ? "✓ Within budget" : "⚠ Over budget"}
        </span>
      </div>

      <div style={{ padding: "1.5rem" }}>
        {/* Line items */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
          {lineItems.map(item => (
            <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.9375rem", color: "var(--color-charcoal)" }}>{item.label}</span>
              <span style={{ fontSize: "0.9375rem", color: "var(--color-charcoal)", fontWeight: 400 }}>
                {formatINR(item.amount)}
              </span>
            </div>
          ))}
        </div>

        {/* Divider + total */}
        <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "0.75rem", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-charcoal)" }}>Total</span>
            <span style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-charcoal)" }}>
              {formatINR(spent)}
            </span>
          </div>
          <p style={{ fontSize: "0.6875rem", color: "var(--color-slate)", marginTop: "0.25rem" }}>
            Lipstick &amp; hairstyle are complimentary styling services.
          </p>
        </div>

        {/* Budget bar */}
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--color-slate)" }}>
              Your budget: <strong style={{ color: "var(--color-charcoal)" }}>{formatINR(budget)}</strong>
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--color-slate)" }}>
              {Math.round(utilPct * 100)}% used
            </span>
          </div>
          <div style={{ height: "6px", background: "var(--color-border)", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${utilPct * 100}%`,
              background: withinBudget ? "var(--color-gold)" : "#DC2626",
              transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
            }} />
          </div>
        </div>

        {/* Remaining */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "0.875rem 1rem",
          background: withinBudget ? "#F0FDF4" : "#FEF2F2",
          border: `1px solid ${withinBudget ? "#BBF7D0" : "#FECACA"}`,
        }}>
          <span style={{ fontSize: "0.9375rem", color: withinBudget ? "#166534" : "#991B1B" }}>
            {withinBudget ? "Remaining" : "Over budget by"}
          </span>
          <span style={{ fontSize: "1.125rem", fontWeight: 700, color: withinBudget ? "#166534" : "#991B1B" }}>
            {formatINR(Math.abs(remaining))}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Why best match ───────────────────────────────────────────────────────────

function WhyBestMatch({ look, preferences }: { look: RankedLook; preferences: UserPreferences }) {
  const bd = look.scoreBreakdown;

  const dimensions = [
    {
      icon: "🎨", label: "Colour profile",
      score: bd.colour,
      detail: `The outfit and accessories carry undertones that match your personal colour analysis, ensuring the palette feels naturally vibrant on you.`,
    },
    {
      icon: "🎉", label: "Occasion",
      score: bd.occasion,
      detail: `Every item in this look — outfit, earrings, bracelet, shoes, and lipstick — was curated for ${preferences.occasion.toLowerCase()} settings, where the appropriate formality and mood matter most.`,
    },
    {
      icon: "✨", label: "Style alignment",
      score: bd.style,
      detail: `The ${preferences.style.toLowerCase()} aesthetic you chose is reflected across the outfit's cut and the accessories' design language, creating a cohesive story.`,
    },
    {
      icon: "⚖️", label: "Silhouette harmony",
      score: bd.silhouette,
      detail: `The earring and bracelet profiles were matched to the outfit's silhouette — ensuring accessories complement rather than compete with the overall drape.`,
    },
    {
      icon: "💰", label: "Budget fit",
      score: bd.budget,
      detail: `This look uses ${Math.round(bd.budget * 100)}% of the available budget score, striking a balance between completeness and value without unnecessary overspend.`,
    },
    {
      icon: "🔗", label: "Coordination",
      score: bd.coordination,
      detail: `All accessories declare compatibility with the ${look.outfit.outfitType} — no mismatched pieces that would break the visual coherence of the complete look.`,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <p className="eyebrow" style={{ marginBottom: "0.4rem" }}>Why Drape chose this</p>
        <h2 className="font-serif" style={{
          fontSize: "clamp(1.25rem, 3vw, 1.875rem)",
          fontWeight: 400, color: "var(--color-charcoal)", lineHeight: 1.15,
        }}>
          The best overall match for your profile.
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--color-slate)", marginTop: "0.5rem", fontWeight: 300 }}>
          Scored across six dimensions — colour, occasion, style, silhouette, budget, and coordination.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1px", border: "1px solid var(--color-border)", background: "var(--color-border)" }}>
        {dimensions.map(dim => (
          <DimensionRow key={dim.label} {...dim} />
        ))}
      </div>

      {/* Composite score callout */}
      <div style={{
        marginTop: "1.5rem",
        padding: "1.25rem 1.5rem",
        background: "#FDF8ED",
        border: "1px solid var(--color-gold-light)",
        display: "flex", alignItems: "center", gap: "1.25rem",
      }}>
        <div style={{
          width: "3.5rem", height: "3.5rem", borderRadius: "50%",
          background: "var(--color-gold)", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span className="font-serif" style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>
            {Math.round(look.score * 100)}
          </span>
        </div>
        <div>
          <p style={{ fontSize: "0.6875rem", color: "var(--color-slate)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.2rem" }}>
            Composite compatibility score
          </p>
          <p className="font-serif" style={{ fontSize: "1rem", color: "var(--color-charcoal)", fontWeight: 400 }}>
            {look.outfit.name} is Drape&rsquo;s top recommendation for your {preferences.occasion.toLowerCase()} look.
          </p>
        </div>
      </div>
    </div>
  );
}

function DimensionRow({ icon, label, score, detail }: { icon: string; label: string; score: number; detail: string }) {
  const [open, setOpen] = useState(false);
  const pct = Math.round(score * 100);

  return (
    <div style={{ background: "#fff" }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="layout-dimension-row"
        aria-expanded={open}
      >
        <span style={{ fontSize: "1rem" }}>{icon}</span>
        <span style={{ fontSize: "0.875rem", color: "var(--color-charcoal)", fontWeight: 500 }}>{label}</span>
        <div style={{ height: "4px", background: "var(--color-border)", overflow: "hidden", minWidth: "3rem" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "var(--color-gold)" }} />
        </div>
        <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-charcoal)", textAlign: "right", whiteSpace: "nowrap" }}>
          {pct}%
        </span>
        <span style={{ fontSize: "0.75rem", color: "var(--color-slate)" }}>{open ? "↑" : "↓"}</span>
      </button>
      {open && (
        <div style={{
          padding: "0 1.25rem 1rem calc(1.25rem + 1.5rem + 0.75rem)",
          fontSize: "0.875rem", color: "var(--color-slate)", lineHeight: 1.7, fontWeight: 300,
        }}>
          {detail}
        </div>
      )}
    </div>
  );
}

// ─── Action strip ─────────────────────────────────────────────────────────────

function ActionStrip({ look }: { look: RankedLook }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem",
      padding: "2rem 0 0",
    }}>
      <div className="gold-rule" style={{ width: "100%", marginBottom: "1rem" }} />

      {/* Primary CTA */}
      {look.outfit.purchaseUrl ? (
        <a
          href={look.outfit.purchaseUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            background: "var(--color-charcoal)", color: "#fff",
            padding: "1rem 3rem",
            fontFamily: "var(--font-sans)",
            fontSize: "0.6875rem", fontWeight: 500,
            letterSpacing: "0.18em", textTransform: "uppercase",
            textDecoration: "none",
          }}
        >
          Shop This Look →
        </a>
      ) : (
        <div style={{
          display: "inline-block",
          background: "var(--color-charcoal)", color: "rgba(255,255,255,0.5)",
          padding: "1rem 3rem",
          fontFamily: "var(--font-sans)",
          fontSize: "0.6875rem", fontWeight: 500,
          letterSpacing: "0.18em", textTransform: "uppercase",
          cursor: "default",
        }}>
          Shop This Look — Coming Soon
        </div>
      )}

      {/* Secondary CTA */}
      <Link
        href="/looks"
        style={{
          display: "inline-block",
          background: "none",
          border: "1px solid var(--color-border)",
          color: "var(--color-charcoal)",
          padding: "0.875rem 2.5rem",
          fontFamily: "var(--font-sans)",
          fontSize: "0.6875rem", fontWeight: 500,
          letterSpacing: "0.18em", textTransform: "uppercase",
          textDecoration: "none",
        }}
      >
        Try Another Look
      </Link>

      <p style={{ fontSize: "0.75rem", color: "var(--color-slate)", fontWeight: 300 }}>
        You can always go back and try on one of the other recommended looks.
      </p>
    </div>
  );
}

