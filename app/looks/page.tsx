"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { RankedLook } from "@/types/catalog";
import type { StylingProfile, UserPreferences } from "@/types/styling";
import { formatINR } from "@/lib/utils";

const cx: React.CSSProperties = {
  width: "100%",
  maxWidth: "72rem",
  marginLeft: "auto",
  marginRight: "auto",
  paddingLeft: "clamp(1.5rem, 4vw, 4rem)",
  paddingRight: "clamp(1.5rem, 4vw, 4rem)",
};

const RANK_META = [
  { medal: "🥇", label: "Best Match",    accent: "#C9A84C", accentLight: "#FDF8ED" },
  { medal: "🥈", label: "Runner-Up",     accent: "#8A9BAE", accentLight: "#F4F6F8" },
  { medal: "🥉", label: "Third Choice",  accent: "#B08A72", accentLight: "#F8F4F1" },
] as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LooksPage() {
  const router = useRouter();
  const [looks, setLooks]   = useState<RankedLook[] | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const rawProfile     = sessionStorage.getItem("drape_profile");
    const rawPreferences = sessionStorage.getItem("drape_preferences");

    if (!rawProfile || !rawPreferences) {
      router.replace("/onboarding");
      return;
    }

    // Return cached looks if already built (skip empty cache — may be stale from a failed run)
    const cached = sessionStorage.getItem("drape_looks");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLooks(parsed);
          setStatus("ready");
          return;
        }
      } catch { /* fall through to re-fetch */ }
    }

    const profile: StylingProfile    = JSON.parse(rawProfile);
    const preferences: UserPreferences = JSON.parse(rawPreferences);

    fetch("/api/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, preferences }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        sessionStorage.setItem("drape_looks", JSON.stringify(data.looks));
        setLooks(data.looks);
        setStatus("ready");
      })
      .catch(err => {
        setErrorMsg(err.message ?? "Could not load recommendations.");
        setStatus("error");
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
          <span className="eyebrow">Your Looks</span>
          <Link href="/profile" style={{ fontSize: "0.75rem", color: "var(--color-slate)", textDecoration: "none", letterSpacing: "0.08em" }}>
            ← Profile
          </Link>
        </div>
      </header>

      <main style={{ padding: "3.5rem 0 6rem" }}>
        <div style={cx}>

          {/* ── Loading ─────────────────────────────────────────────── */}
          {status === "loading" && <LoadingState />}

          {/* ── Error ───────────────────────────────────────────────── */}
          {status === "error" && (
            <div style={{ textAlign: "center", padding: "5rem 0" }}>
              <p style={{ fontSize: "0.875rem", color: "#dc2626", marginBottom: "1.5rem" }}>{errorMsg}</p>
              <Link href="/onboarding" style={{ fontSize: "0.8125rem", color: "var(--color-slate)", textDecoration: "underline" }}>
                ← Start over
              </Link>
            </div>
          )}

          {/* ── Looks ───────────────────────────────────────────────── */}
          {status === "ready" && looks && (
            <div className="animate-fade-up">
              {/* Heading */}
              <div style={{ marginBottom: "2.5rem" }}>
                <p className="eyebrow" style={{ marginBottom: "0.5rem" }}>Curated for you</p>
                <h1 className="font-serif" style={{
                  fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
                  fontWeight: 400, lineHeight: 1.1,
                  color: "var(--color-charcoal)",
                }}>
                  Your 3 Best Looks
                </h1>
                <p style={{ fontSize: "0.875rem", color: "var(--color-slate)", marginTop: "0.75rem", fontWeight: 300 }}>
                  Each look is scored for colour, occasion, and style compatibility with your profile.
                </p>
              </div>

              {/* Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {looks.map((look, i) => (
                  <LookCard key={look.id} look={look} index={i} />
                ))}
              </div>

              {/* Footer nudge */}
              {looks.length === 0 && (
                <div style={{ textAlign: "center", padding: "3rem 0" }}>
                  <p style={{ color: "var(--color-slate)", fontSize: "0.9375rem" }}>
                    No looks found within your budget. Try adjusting your preferences.
                  </p>
                  <Link href="/onboarding" style={{ display: "inline-block", marginTop: "1.5rem", fontSize: "0.8125rem", color: "var(--color-charcoal)", textDecoration: "underline" }}>
                    Adjust preferences
                  </Link>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// ─── Look Card ─────────────────────────────────────────────────────────────────

function LookCard({ look, index }: { look: RankedLook; index: number }) {
  const [whyOpen, setWhyOpen] = useState(false);
  const meta = RANK_META[index] ?? RANK_META[2];
  const isPrimary = index === 0;
  const scorePercent = Math.round(look.score * 100);

  return (
    <div style={{
      border: isPrimary ? `2px solid ${meta.accent}` : "1px solid var(--color-border)",
      background: isPrimary ? meta.accentLight : "#fff",
      overflow: "hidden",
      transition: "box-shadow 0.2s ease",
    }}>
      {/* Rank ribbon */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.625rem 1.25rem",
        background: isPrimary ? meta.accent : "var(--color-ivory-dark)",
        borderBottom: "1px solid var(--color-border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: isPrimary ? "1.25rem" : "1rem" }}>{meta.medal}</span>
          <span style={{
            fontFamily: "var(--font-sans)",
            fontSize: "0.6875rem", fontWeight: 600,
            letterSpacing: "0.12em", textTransform: "uppercase",
            color: isPrimary ? "#fff" : "var(--color-charcoal)",
          }}>
            {meta.label}
          </span>
        </div>
        {/* Score pill */}
        <div style={{
          padding: "0.2rem 0.65rem",
          background: isPrimary ? "rgba(255,255,255,0.25)" : "var(--color-border)",
          fontSize: "0.6875rem", fontWeight: 600,
          letterSpacing: "0.06em",
          color: isPrimary ? "#fff" : "var(--color-charcoal)",
        }}>
          {scorePercent}% match
        </div>
      </div>

      {/* Main content */}
      <div className="layout-image-text">
        {/* Outfit image */}
        <div style={{
          position: "relative",
          background: "var(--color-ivory-dark)",
          minHeight: "clamp(14rem, 28vw, 18rem)",
          overflow: "hidden",
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={look.outfit.image}
            alt={look.outfit.name}
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              objectFit: "cover",
            }}
          />
        </div>

        {/* Details */}
        <div style={{ padding: "clamp(1rem, 3vw, 1.75rem)", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {/* Name + price */}
          <div>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
              <h2 className="font-serif" style={{
                fontSize: "clamp(1.125rem, 2.5vw, 1.5rem)",
                fontWeight: 400,
                color: "var(--color-charcoal)",
                lineHeight: 1.2,
              }}>
                {look.outfit.name}
              </h2>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "1.125rem", fontWeight: 600, color: "var(--color-charcoal)" }}>
                  {formatINR(look.totalPriceINR)}
                </p>
                {look.overBudget ? (
                  <p style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.08em", color: "#b45309", backgroundColor: "#fef3c7", padding: "0.1rem 0.4rem", borderRadius: "0.25rem", marginTop: "0.2rem", display: "inline-block" }}>
                    OVER BUDGET
                  </p>
                ) : (
                  <p style={{ fontSize: "0.6875rem", color: "var(--color-slate)", letterSpacing: "0.06em", marginTop: "0.1rem" }}>
                    COMPLETE LOOK
                  </p>
                )}
              </div>
            </div>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-slate)", marginTop: "0.35rem" }}>
              {look.outfit.outfitType} · {look.outfit.colour}
            </p>
          </div>

          {/* Score bar */}
          <ScoreBar score={look.score} accentColor={meta.accent} />

          {/* Accessories row */}
          <AccessoriesRow look={look} />

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginTop: "auto" }}>
            <Link
              href={`/tryon?lookId=${encodeURIComponent(look.id)}`}
              onClick={() => {
                // Persist selected look for tryon page
                sessionStorage.setItem("drape_selected_look", JSON.stringify(look));
              }}
              style={{
                display: "inline-block",
                background: "var(--color-charcoal)",
                color: "#fff",
                padding: "0.625rem 1.5rem",
                fontFamily: "var(--font-sans)",
                fontSize: "0.6875rem", fontWeight: 500,
                letterSpacing: "0.15em", textTransform: "uppercase",
                textDecoration: "none",
                flexShrink: 0,
              }}
            >
              Try On →
            </Link>

            <button
              onClick={() => setWhyOpen(v => !v)}
              style={{
                background: "none", border: "1px solid var(--color-border)",
                padding: "0.625rem 1rem",
                fontFamily: "var(--font-sans)",
                fontSize: "0.6875rem", fontWeight: 500,
                letterSpacing: "0.1em", textTransform: "uppercase",
                color: "var(--color-slate)",
                cursor: "pointer",
                transition: "border-color 0.15s ease, color 0.15s ease",
              }}
              aria-expanded={whyOpen}
            >
              {whyOpen ? "Hide ↑" : "Why this? ↓"}
            </button>
          </div>

          {/* "Why this?" expanded panel */}
          {whyOpen && <WhyPanel look={look} accentColor={meta.accent} />}
        </div>
      </div>
    </div>
  );
}

// ─── Score bar ────────────────────────────────────────────────────────────────

function ScoreBar({ score, accentColor }: { score: number; accentColor: string }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
        <span style={{ fontSize: "0.6875rem", color: "var(--color-slate)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Compatibility
        </span>
        <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--color-charcoal)" }}>
          {Math.round(score * 100)}%
        </span>
      </div>
      <div style={{ height: "4px", background: "var(--color-border)", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${score * 100}%`,
          background: accentColor,
          transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
        }} />
      </div>
    </div>
  );
}

// ─── Accessories row ──────────────────────────────────────────────────────────

function AccessoriesRow({ look }: { look: RankedLook }) {
  const items = [
    { label: "Earrings",  value: look.earrings.name,  hex: look.earrings.colourHex  },
    { label: "Bracelet",  value: look.bracelet.name,  hex: look.bracelet.colourHex  },
    { label: "Shoes",     value: look.shoes.name,     hex: look.shoes.colourHex     },
    { label: "Lip",       value: look.lipstick.shadeName, hex: look.lipstick.hexCode },
    { label: "Hair",      value: look.hairstyle.name, hex: null                     },
  ];

  return (
    <div>
      <p className="eyebrow" style={{ marginBottom: "0.5rem" }}>Complete Look</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {items.map(item => (
          <div key={item.label} style={{
            display: "flex", alignItems: "center", gap: "0.375rem",
            padding: "0.3rem 0.6rem",
            background: "var(--color-ivory)",
            border: "1px solid var(--color-border)",
            fontSize: "0.75rem",
          }}>
            {item.hex && (
              <div style={{
                width: "0.75rem", height: "0.75rem", borderRadius: "50%",
                background: item.hex,
                border: "1px solid rgba(0,0,0,0.1)",
                flexShrink: 0,
              }} />
            )}
            <span style={{ color: "var(--color-slate)", fontWeight: 400 }}>{item.label}:</span>
            <span style={{ color: "var(--color-charcoal)", fontWeight: 500 }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── "Why this?" panel ────────────────────────────────────────────────────────

function WhyPanel({ look, accentColor }: { look: RankedLook; accentColor: string }) {
  const bd = look.scoreBreakdown;

  const dimensions = [
    { key: "colour",       label: "Colour harmony",   score: bd.colour,       weight: "30%" },
    { key: "occasion",     label: "Occasion fit",     score: bd.occasion,     weight: "20%" },
    { key: "style",        label: "Style alignment",  score: bd.style,        weight: "20%" },
    { key: "silhouette",   label: "Silhouette match", score: bd.silhouette,   weight: "15%" },
    { key: "budget",       label: "Budget fit",       score: bd.budget,       weight: "10%" },
    { key: "coordination", label: "Coordination",     score: bd.coordination, weight: "5%"  },
  ] as const;

  return (
    <div style={{
      marginTop: "0.25rem",
      padding: "1rem 1.25rem",
      background: "var(--color-ivory)",
      border: "1px solid var(--color-border)",
      borderLeft: `3px solid ${accentColor}`,
    }}>
      {/* Reason text */}
      <p style={{ fontSize: "0.875rem", color: "var(--color-charcoal)", lineHeight: 1.65, marginBottom: "1rem", fontWeight: 300 }}>
        {look.reason}
      </p>

      {/* Score breakdown */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {dimensions.map(dim => (
          <div key={dim.key} style={{ display: "grid", gridTemplateColumns: "8.5rem 1fr 2.5rem", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ fontSize: "0.6875rem", color: "var(--color-slate)", letterSpacing: "0.05em" }}>{dim.label}</span>
              <span style={{ fontSize: "0.5625rem", color: "var(--color-slate)", opacity: 0.7 }}>({dim.weight})</span>
            </div>
            <div style={{ height: "3px", background: "var(--color-border)", overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${dim.score * 100}%`,
                background: accentColor, opacity: 0.8,
              }} />
            </div>
            <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--color-charcoal)", textAlign: "right" }}>
              {Math.round(dim.score * 100)}%
            </span>
          </div>
        ))}
      </div>

      {/* Price breakdown */}
      <div style={{ marginTop: "1rem", paddingTop: "0.875rem", borderTop: "1px solid var(--color-border)" }}>
        <p className="eyebrow" style={{ marginBottom: "0.5rem" }}>Price breakdown</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem 1.5rem" }}>
          {[
            { label: "Outfit",   price: look.outfit.priceINR   },
            { label: "Earrings", price: look.earrings.priceINR },
            { label: "Bracelet", price: look.bracelet.priceINR },
            { label: "Shoes",    price: look.shoes.priceINR    },
          ].map(item => (
            <div key={item.label} style={{ fontSize: "0.8125rem" }}>
              <span style={{ color: "var(--color-slate)" }}>{item.label}: </span>
              <span style={{ color: "var(--color-charcoal)", fontWeight: 500 }}>{formatINR(item.price)}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-charcoal)", marginTop: "0.5rem" }}>
          Total: {formatINR(look.totalPriceINR)}
          <span style={{ fontWeight: 300, color: "var(--color-slate)", marginLeft: "0.5rem", fontSize: "0.75rem" }}>
            (lipstick &amp; hairstyle are complimentary styling services)
          </span>
        </p>
      </div>
    </div>
  );
}

// ─── Loading state ────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div>
      <div style={{ marginBottom: "2.5rem" }}>
        <div className="skeleton" style={{ width: "8rem", height: "0.75rem", marginBottom: "0.75rem" }} />
        <div className="skeleton" style={{ width: "16rem", height: "2rem" }} />
      </div>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          border: "1px solid var(--color-border)",
          marginBottom: "1.5rem",
          overflow: "hidden",
          opacity: 1 - i * 0.2,
        }}>
          <div className="skeleton" style={{ height: "2.5rem" }} />
          <div className="layout-image-text">
            <div className="skeleton" style={{ height: "clamp(14rem, 28vw, 18rem)" }} />
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="skeleton" style={{ width: "60%", height: "1.5rem" }} />
              <div className="skeleton" style={{ width: "40%", height: "1rem" }} />
              <div className="skeleton" style={{ width: "100%", height: "0.5rem" }} />
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {[1,2,3].map(j => <div key={j} className="skeleton" style={{ width: "5rem", height: "1.75rem" }} />)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

