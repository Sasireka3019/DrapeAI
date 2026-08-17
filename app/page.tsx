import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";

/* Inline container — avoids Tailwind mx-auto scan issues */
const cx: React.CSSProperties = {
  width: "100%",
  maxWidth: "72rem",
  marginLeft: "auto",
  marginRight: "auto",
  paddingLeft: "clamp(1.5rem, 4vw, 4rem)",
  paddingRight: "clamp(1.5rem, 4vw, 4rem)",
};

const steps = [
  {
    number: "01",
    label: "Upload",
    title: "Your photo, analyzed",
    body: "Share a clear photo. Drape reads your skin tone, undertone, and proportions to build your unique styling profile.",
  },
  {
    number: "02",
    label: "Recommend",
    title: "Three complete looks",
    body: "Receive three coordinated looks — each with an outfit, accessories, shoes, and lipstick — selected specifically for you.",
  },
  {
    number: "03",
    label: "Try On",
    title: "See it on you",
    body: "Use AI virtual try-on to see the outfit on your own body. No guessing. No surprises.",
  },
  {
    number: "04",
    label: "Complete",
    title: "The full picture",
    body: "Review your complete styled look, check it against your budget, and shop with confidence.",
  },
];

const lookItems = [
  { icon: "👗", label: "Outfit",            sub: "Curated for your style"     },
  { icon: "💎", label: "Earrings",          sub: "Coordinated accessories"    },
  { icon: "💍", label: "Bracelet / Bangle", sub: "Hand-picked to match"       },
  { icon: "👠", label: "Shoes",             sub: "Head-to-toe harmony"        },
  { icon: "💄", label: "Lipstick shade",    sub: "Matched to your skin tone"  },
  { icon: "💇", label: "Hairstyle",         sub: "Suggested for the occasion" },
];

export default function HomePage() {
  return (
    <div style={{ backgroundColor: "var(--color-ivory)", color: "var(--color-charcoal)" }}>
      <Header showCta={false} />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section
        style={{ minHeight: "100vh", paddingTop: "64px", display: "flex", flexDirection: "column", justifyContent: "center", paddingBottom: "6rem" }}
      >
        <div style={cx}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "4rem",
            alignItems: "center",
          }}>

            {/* Text column */}
            <div>
              <p className="eyebrow animate-fade-up" style={{ marginBottom: "2rem" }}>
                AI Personal Stylist
              </p>

              <h1
                className="font-serif animate-fade-up animate-fade-up-delay-1"
                style={{
                  fontSize: "clamp(3rem,7vw,6.5rem)",
                  fontWeight: 400,
                  lineHeight: 1.0,
                  color: "var(--color-charcoal)",
                }}
              >
                Your complete
                <br />
                <em style={{ fontStyle: "italic" }}>look,</em> before
                <br />
                you buy.
              </h1>

              <div
                style={{
                  width: "2.5rem", height: "1px",
                  background: "var(--color-gold)",
                  display: "block", margin: "2.5rem 0",
                }}
                className="animate-fade-up animate-fade-up-delay-2"
              />

              <p
                className="animate-fade-up animate-fade-up-delay-2"
                style={{
                  fontSize: "1.0625rem", fontWeight: 300,
                  lineHeight: 1.75, color: "var(--color-slate)",
                  maxWidth: "28rem",
                }}
              >
                Discover outfits chosen for you, try them virtually,
                and complete your look before you buy.
              </p>

              <div
                className="animate-fade-up animate-fade-up-delay-3"
                style={{ marginTop: "2.5rem", display: "flex", flexWrap: "wrap", gap: "1rem" }}
              >
                <Link href="/onboarding">
                  <Button variant="primary" size="lg">Find My Look</Button>
                </Link>
                <Link href="#how-it-works">
                  <Button variant="ghost" size="lg">How it works</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Divider ───────────────────────────────────────────────────── */}
      <div style={{ height: "1px", background: "var(--color-border)" }} />

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: "6rem 0" }}>
        <div style={cx}>

          <div style={{ marginBottom: "3.5rem" }}>
            <p className="eyebrow" style={{ marginBottom: "1rem" }}>Process</p>
            <h2
              className="font-serif"
              style={{
                fontSize: "clamp(1.75rem,3.5vw,3rem)", fontWeight: 400,
                lineHeight: 1.15, color: "var(--color-charcoal)",
              }}
            >
              Analyze. Recommend.
              <br />
              Try. Complete.
            </h2>
          </div>

          <div className="layout-steps-grid">
            {steps.map((step, i) => (
              <div
                key={step.number}
                style={{
                  padding: "2.5rem 2rem",
                  borderRight: i % 2 === 0 ? "1px solid var(--color-border)" : undefined,
                  display: "flex", flexDirection: "column", gap: "1.25rem",
                  background: "var(--color-ivory)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span
                    className="font-serif"
                    style={{
                      fontSize: "2.5rem", fontWeight: 400,
                      color: "var(--color-border)", lineHeight: 1, userSelect: "none",
                    }}
                  >
                    {step.number}
                  </span>
                  <span className="eyebrow">{step.label}</span>
                </div>
                <div>
                  <h3
                    className="font-serif"
                    style={{
                      fontSize: "1.125rem", fontWeight: 400,
                      color: "var(--color-charcoal)", marginBottom: "0.625rem", lineHeight: 1.3,
                    }}
                  >
                    {step.title}
                  </h3>
                  <p style={{ fontSize: "0.875rem", fontWeight: 300, color: "var(--color-slate)", lineHeight: 1.7 }}>
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What you get ──────────────────────────────────────────────── */}
      <section style={{ padding: "5rem 0", background: "var(--color-charcoal)", color: "#fff" }}>
        <div style={cx}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "3rem", alignItems: "center" }}>

            <div>
              <p className="eyebrow" style={{ color: "var(--color-gold-light)", marginBottom: "1.5rem" }}>
                Every look includes
              </p>
              <h2
                className="font-serif"
                style={{
                  fontSize: "clamp(1.75rem,3.5vw,2.75rem)", fontWeight: 400,
                  lineHeight: 1.15, marginBottom: "1.5rem", color: "#fff",
                }}
              >
                Not just an outfit.
                <br />
                <em style={{ fontStyle: "italic" }}>A complete look.</em>
              </h2>
              <p
                style={{
                  fontSize: "0.9375rem", fontWeight: 300,
                  color: "rgba(255,255,255,0.55)", lineHeight: 1.7, maxWidth: "26rem",
                }}
              >
                Each recommendation is coordinated from head to toe — so you
                never have to wonder what goes with what.
              </p>
            </div>

            <ul className="layout-look-items-grid" style={{ listStyle: "none" }}>
              {lookItems.map(({ icon, label, sub }) => (
                <li
                  key={label}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: "0.875rem",
                    padding: "1.25rem 1rem",
                    background: "var(--color-charcoal)",
                  }}
                >
                  <span style={{ fontSize: "1.375rem", lineHeight: 1, marginTop: "0.1rem", flexShrink: 0 }} aria-hidden="true">
                    {icon}
                  </span>
                  <div>
                    <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "#fff" }}>{label}</p>
                    <p style={{ fontSize: "0.75rem", fontWeight: 300, color: "rgba(255,255,255,0.45)", marginTop: "0.2rem" }}>
                      {sub}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section style={{ padding: "7rem 0", textAlign: "center" }}>
        <div style={{ ...cx, maxWidth: "40rem" }}>
          <p className="eyebrow" style={{ marginBottom: "1.5rem" }}>Ready?</p>
          <h2
            className="font-serif"
            style={{
              fontSize: "clamp(2rem,5vw,4rem)", fontWeight: 400,
              lineHeight: 1.1, color: "var(--color-charcoal)", marginBottom: "2.5rem",
            }}
          >
            Your look is
            <br />
            <em style={{ fontStyle: "italic" }}>waiting for you.</em>
          </h2>
          <Link href="/onboarding">
            <Button variant="primary" size="lg">Find My Look</Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid var(--color-border)", padding: "2.5rem 0" }}>
        <div
          style={{ ...cx, display: "flex", alignItems: "center", justifyContent: "space-between" }}
        >
          <p className="font-serif" style={{ fontSize: "1.125rem", color: "var(--color-charcoal)" }}>
            Drape
          </p>
          <p
            style={{ fontSize: "0.75rem", fontWeight: 300, color: "var(--color-slate)", letterSpacing: "0.06em" }}
          >
            Your complete look, before you buy.
          </p>
        </div>
      </footer>
    </div>
  );
}
