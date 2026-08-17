"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Data ────────────────────────────────────────────────────────────────────

const OCCASIONS = [
  "Wedding", "Engagement", "Reception", "Haldi", "Mehendi",
  "Party", "Festival", "Date", "Office", "Vacation",
];

const STYLES = [
  "Elegant", "Traditional", "Minimal", "Trendy", "Glamorous", "Contemporary",
];

const OUTFITS = ["Gown", "Dress", "Midi", "CoordSet", "Surprise Me"];

const BUDGETS: { label: string; value: number }[] = [
  { label: "₹2,000",  value: 2000  },
  { label: "₹3,000",  value: 3000  },
  { label: "₹5,000",  value: 5000  },
  { label: "₹10,000", value: 10000 },
  { label: "₹20,000+", value: 20000 },
];

const STEPS = ["Occasion", "Style", "Outfit", "Budget", "Your Photo"];

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

// ─── State shape ─────────────────────────────────────────────────────────────

interface OnboardingData {
  occasion: string;
  style: string;
  outfitType: string;
  budgetINR: number;
}

// ─── Shared inline container ─────────────────────────────────────────────────

const cxStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "52rem",
  marginLeft: "auto",
  marginRight: "auto",
  paddingLeft: "clamp(1.5rem, 4vw, 3rem)",
  paddingRight: "clamp(1.5rem, 4vw, 3rem)",
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0–4
  const [data, setData] = useState<Partial<OnboardingData>>({});
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function pick<K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) {
    const next = { ...data, [key]: value };
    setData(next);
    // auto-advance for selection steps
    if (step < 4) setTimeout(() => setStep(step + 1), 180);
  }

  function handleFile(file: File) {
    setPhotoError(null);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setPhotoError("Please upload a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setPhotoError("Image must be under 10 MB.");
      return;
    }
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhoto(file);
    setPhotoUrl(URL.createObjectURL(file));
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // reset so the same file can be re-selected
    e.target.value = "";
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [photoUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  function handleSubmit() {
    if (!photo || !data.occasion || !data.style || !data.outfitType || !data.budgetINR) return;

    // Persist preferences; photo will be read from sessionStorage as dataURL
    const reader = new FileReader();
    reader.onload = () => {
      sessionStorage.setItem("drape_preferences", JSON.stringify(data));
      sessionStorage.setItem("drape_photo_data_url", reader.result as string);
      sessionStorage.setItem("drape_photo_name", photo.name);
      sessionStorage.setItem("drape_photo_type", photo.type);
      router.push("/profile");
    };
    reader.readAsDataURL(photo);
  }

  const progress = ((step + (step === 4 && photo ? 1 : 0)) / STEPS.length) * 100;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-ivory)", display: "flex", flexDirection: "column" }}>

      {/* ── Top bar ───────────────────────────────────────────────────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        backgroundColor: "rgba(250,248,245,0.95)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--color-border)",
      }}>
        <div style={{ ...cxStyle, maxWidth: "72rem", height: "4rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" className="font-serif" style={{ fontSize: "1.125rem", color: "var(--color-charcoal)", textDecoration: "none" }}>
            Drape
          </Link>
          <span className="eyebrow">{step + 1} of {STEPS.length}</span>
        </div>

        {/* Progress bar */}
        <div style={{ height: "2px", background: "var(--color-border)" }}>
          <div style={{
            height: "100%",
            width: `${progress}%`,
            background: "var(--color-gold)",
            transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)",
          }} />
        </div>
      </header>

      {/* ── Step content ──────────────────────────────────────────────── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "3rem 0 5rem" }}>
        <div style={cxStyle}>

          {/* Step label */}
          <div style={{ marginBottom: "2.5rem" }}>
            <p className="eyebrow" style={{ marginBottom: "0.75rem" }}>
              Step {step + 1} — {STEPS[step]}
            </p>
            <h1 className="font-serif" style={{
              fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
              fontWeight: 400,
              lineHeight: 1.15,
              color: "var(--color-charcoal)",
            }}>
              {stepHeading(step)}
            </h1>
          </div>

          {/* ── Occasion ──────────────────────────────────────────────── */}
          {step === 0 && (
            <OptionGrid>
              {OCCASIONS.map(o => (
                <OptionTile
                  key={o} label={o}
                  selected={data.occasion === o}
                  onClick={() => pick("occasion", o)}
                />
              ))}
            </OptionGrid>
          )}

          {/* ── Style ─────────────────────────────────────────────────── */}
          {step === 1 && (
            <OptionGrid cols={3}>
              {STYLES.map(s => (
                <OptionTile
                  key={s} label={s}
                  selected={data.style === s}
                  onClick={() => pick("style", s)}
                />
              ))}
            </OptionGrid>
          )}

          {/* ── Outfit ────────────────────────────────────────────────── */}
          {step === 2 && (
            <OptionGrid cols={3}>
              {OUTFITS.map(o => (
                <OptionTile
                  key={o} label={o}
                  selected={data.outfitType === o}
                  accent={o === "Surprise Me"}
                  onClick={() => pick("outfitType", o)}
                />
              ))}
            </OptionGrid>
          )}

          {/* ── Budget ────────────────────────────────────────────────── */}
          {step === 3 && (
            <OptionGrid cols={3}>
              {BUDGETS.map(b => (
                <OptionTile
                  key={b.label} label={b.label}
                  selected={data.budgetINR === b.value}
                  large
                  onClick={() => pick("budgetINR", b.value)}
                />
              ))}
            </OptionGrid>
          )}

          {/* ── Photo ─────────────────────────────────────────────────── */}
          {step === 4 && (
            <div>
              {/* Upload zone */}
              {!photoUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  style={{
                    border: `2px dashed ${isDragging ? "var(--color-gold)" : "var(--color-border)"}`,
                    borderRadius: 2,
                    padding: "4rem 2rem",
                    textAlign: "center",
                    cursor: "pointer",
                    background: isDragging ? "rgba(201,168,76,0.04)" : "var(--color-white)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📷</div>
                  <p className="font-serif" style={{ fontSize: "1.25rem", fontWeight: 400, color: "var(--color-charcoal)", marginBottom: "0.5rem" }}>
                    Upload your photo
                  </p>
                  <p style={{ fontSize: "0.875rem", color: "var(--color-slate)", fontWeight: 300 }}>
                    Drag & drop or click to browse
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-slate)", marginTop: "0.5rem", opacity: 0.7 }}>
                    JPG, PNG or WebP · Max 10 MB
                  </p>
                </div>
              ) : (
                /* Preview */
                <div>
                  <div style={{ position: "relative", display: "inline-block", width: "100%" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoUrl}
                      alt="Your uploaded photo"
                      style={{
                        width: "100%",
                        maxHeight: "28rem",
                        objectFit: "contain",
                        border: "1px solid var(--color-border)",
                        background: "#fff",
                        display: "block",
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1rem" }}>
                    <p style={{ fontSize: "0.8125rem", color: "var(--color-slate)" }}>
                      {photo?.name}
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: "0.75rem", color: "var(--color-gold)",
                        fontFamily: "var(--font-sans)",
                        textDecoration: "underline", padding: 0,
                        letterSpacing: "0.04em",
                      }}
                    >
                      Replace photo
                    </button>
                  </div>
                </div>
              )}

              {/* Tip */}
              <div style={{
                marginTop: "1.5rem",
                padding: "1rem 1.25rem",
                background: "var(--color-ivory-dark)",
                border: "1px solid var(--color-border)",
              }}>
                <p style={{ fontSize: "0.8125rem", color: "var(--color-slate)", lineHeight: 1.6 }}>
                  <strong style={{ color: "var(--color-charcoal)", fontWeight: 500 }}>Best results:</strong>{" "}
                  A clear, full-body photo facing forward. Good lighting. Single person only.
                </p>
              </div>

              {photoError && (
                <p style={{ marginTop: "0.75rem", fontSize: "0.8125rem", color: "#dc2626" }}>
                  {photoError}
                </p>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                onChange={handleFileInput}
                style={{ display: "none" }}
                aria-label="Upload photo"
              />
            </div>
          )}

        </div>
      </main>

      {/* ── Bottom nav ────────────────────────────────────────────────── */}
      <nav style={{
        position: "sticky", bottom: 0,
        backgroundColor: "rgba(250,248,245,0.97)",
        backdropFilter: "blur(8px)",
        borderTop: "1px solid var(--color-border)",
        padding: "1rem 0",
      }}>
        <div style={{ ...cxStyle, maxWidth: "72rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} style={ghostBtnStyle}>
              ← Back
            </button>
          ) : (
            <Link href="/" style={ghostBtnStyle}>← Back</Link>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{
                width: i === step ? "1.5rem" : "0.4rem",
                height: "0.4rem",
                borderRadius: "9999px",
                background: i <= step ? "var(--color-charcoal)" : "var(--color-border)",
                transition: "all 0.3s ease",
              }} />
            ))}
          </div>

          {step === 4 ? (
            <button
              onClick={handleSubmit}
              disabled={!photo}
              style={{
                ...primaryBtnStyle,
                opacity: photo ? 1 : 0.4,
                cursor: photo ? "pointer" : "not-allowed",
              }}
            >
              Find My Look →
            </button>
          ) : (
            // Show a skip/next only if selection already made
            <div style={{ minWidth: "8rem" }} />
          )}
        </div>
      </nav>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function OptionGrid({ children, cols = 4 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(auto-fill, minmax(${cols === 3 ? "9rem" : "8rem"}, 1fr))`,
      gap: "0.75rem",
    }}>
      {children}
    </div>
  );
}

function OptionTile({
  label, selected, onClick, accent = false, large = false,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  accent?: boolean;
  large?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: large ? "1.25rem 0.75rem" : "0.875rem 0.75rem",
        border: selected
          ? "2px solid var(--color-charcoal)"
          : accent
            ? "1px solid var(--color-gold)"
            : "1px solid var(--color-border)",
        background: selected
          ? "var(--color-charcoal)"
          : accent
            ? "rgba(201,168,76,0.06)"
            : "var(--color-white)",
        color: selected ? "#fff" : accent ? "var(--color-gold)" : "var(--color-charcoal)",
        cursor: "pointer",
        fontFamily: "var(--font-sans)",
        fontSize: large ? "1.0625rem" : "0.875rem",
        fontWeight: selected ? 500 : 400,
        letterSpacing: "0.01em",
        transition: "all 0.15s ease",
        borderRadius: 2,
        textAlign: "center",
        lineHeight: 1.3,
      }}
    >
      {label}
    </button>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ghostBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: "0.8125rem",
  fontFamily: "var(--font-sans)",
  color: "var(--color-slate)",
  letterSpacing: "0.04em",
  padding: "0.5rem 0",
  textDecoration: "none",
  display: "inline-block",
};

const primaryBtnStyle: React.CSSProperties = {
  background: "var(--color-charcoal)",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  fontFamily: "var(--font-sans)",
  fontSize: "0.6875rem",
  fontWeight: 500,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  padding: "0.875rem 1.75rem",
  transition: "background 0.2s ease",
};

// ─── Step headings ────────────────────────────────────────────────────────────

function stepHeading(step: number): string {
  switch (step) {
    case 0: return "What's the occasion?";
    case 1: return "What's your style?";
    case 2: return "What would you like to wear?";
    case 3: return "What's your budget?";
    case 4: return "Upload a photo of yourself.";
    default: return "";
  }
}

