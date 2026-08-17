"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { StylingProfile } from "@/types/styling";

const cx: React.CSSProperties = {
  width: "100%",
  maxWidth: "48rem",
  marginLeft: "auto",
  marginRight: "auto",
  paddingLeft: "clamp(1.5rem, 4vw, 3rem)",
  paddingRight: "clamp(1.5rem, 4vw, 3rem)",
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<StylingProfile | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const photoDataUrl = sessionStorage.getItem("drape_photo_data_url");
    const photoType    = sessionStorage.getItem("drape_photo_type") ?? "image/jpeg";

    if (!photoDataUrl) {
      router.replace("/onboarding");
      return;
    }

    fetch("/api/styling-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoDataUrl, photoType }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        sessionStorage.setItem("drape_profile", JSON.stringify(data.profile));
        setProfile(data.profile);
        setStatus("ready");
      })
      .catch(err => {
        setErrorMsg(err.message ?? "Something went wrong.");
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
          <span className="eyebrow">Styling Profile</span>
        </div>
      </header>

      <main style={{ padding: "4rem 0 6rem" }}>
        <div style={cx}>

          {/* ── Loading ─────────────────────────────────────────────── */}
          {status === "loading" && (
            <div style={{ textAlign: "center", padding: "5rem 0" }}>
              <div style={{
                width: "2.5rem", height: "2.5rem",
                border: "2px solid var(--color-border)",
                borderTopColor: "var(--color-gold)",
                borderRadius: "50%",
                animation: "spin 0.9s linear infinite",
                margin: "0 auto 2rem",
              }} />
              <p className="font-serif" style={{ fontSize: "1.25rem", fontWeight: 400, color: "var(--color-charcoal)", marginBottom: "0.5rem" }}>
                Analysing your colours…
              </p>
              <p style={{ fontSize: "0.875rem", color: "var(--color-slate)", fontWeight: 300 }}>
                This usually takes about 15–20 seconds.
              </p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* ── Error ───────────────────────────────────────────────── */}
          {status === "error" && (
            <div style={{ textAlign: "center", padding: "5rem 0" }}>
              <p style={{ fontSize: "0.875rem", color: "#dc2626", marginBottom: "1.5rem" }}>
                {errorMsg}
              </p>
              <Link href="/onboarding" style={{ fontSize: "0.8125rem", color: "var(--color-slate)", textDecoration: "underline" }}>
                ← Try again
              </Link>
            </div>
          )}

          {/* ── Profile card ────────────────────────────────────────── */}
          {status === "ready" && profile && (
            <div className="animate-fade-up">
              {/* Eyebrow */}
              <p className="eyebrow" style={{ marginBottom: "0.75rem" }}>Your Styling Profile</p>
              <h1 className="font-serif" style={{
                fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
                fontWeight: 400, lineHeight: 1.1,
                color: "var(--color-charcoal)",
                marginBottom: "2.5rem",
              }}>
                Here&rsquo;s what we see in you.
              </h1>

              {/* Source badge */}
              {profile.source === "estimated" && (
                <div style={{
                  padding: "0.75rem 1rem",
                  background: "#FFFBEB",
                  border: "1px solid #FCD34D",
                  marginBottom: "2rem",
                  fontSize: "0.8125rem",
                  color: "#92400E",
                  lineHeight: 1.6,
                }}>
                  <strong>Estimated profile</strong> — Drape couldn&rsquo;t detect your face in this photo
                  (it works best with a clear, forward-facing close-up). Your palette is based on common warm tones.
                  You can refine it after seeing your looks.
                </div>
              )}

              {/* Main card */}
              <div style={{
                border: "1px solid var(--color-border)",
                background: "#fff",
                padding: "clamp(1.5rem, 4vw, 2.5rem)",
                marginBottom: "1.5rem",
              }}>
                {/* Row: skin tone */}
                <ProfileRow label="Skin tone">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                    <div style={{
                      width: "2.25rem", height: "2.25rem", borderRadius: "50%",
                      background: profile.skinColourHex,
                      border: "1px solid rgba(0,0,0,0.08)",
                      flexShrink: 0,
                    }} />
                    <span className="font-serif" style={{ fontSize: "1.125rem", fontWeight: 400, color: "var(--color-charcoal)" }}>
                      {profile.skinToneLabel}
                    </span>
                  </div>
                </ProfileRow>

                <Divider />

                {/* Row: undertone */}
                <ProfileRow label="Colour profile">
                  <span className="font-serif" style={{ fontSize: "1.125rem", fontWeight: 400, color: "var(--color-charcoal)", textTransform: "capitalize" }}>
                    {profile.undertone === "warm"    ? "Warm" :
                     profile.undertone === "cool"    ? "Cool" : "Neutral"}
                  </span>
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-slate)", marginTop: "0.35rem", fontWeight: 300 }}>
                    {profile.undertone === "warm"
                      ? "Golden and yellow undertones. Earthy, rich colours flatter you most."
                      : profile.undertone === "cool"
                        ? "Pink and blue undertones. Jewel tones and cool shades are your best friends."
                        : "Balanced undertones. You can wear a wide range of colours beautifully."
                    }
                  </p>
                </ProfileRow>

                <Divider />

                {/* Row: eye & hair (only if analyzed) */}
                {profile.source === "analyzed" && profile.rawColors && (
                  <>
                    <ProfileRow label="Detected tones">
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                        {profile.rawColors.eyeColor && (
                          <ColorDot label={`Eyes · ${profile.rawColors.eyeColorName ?? "–"}`} hex={profile.rawColors.eyeColor} />
                        )}
                        {profile.rawColors.lipColor && (
                          <ColorDot label="Natural lip" hex={profile.rawColors.lipColor} />
                        )}
                        {profile.rawColors.hairColor && (
                          <ColorDot label={`Hair · ${profile.rawColors.hairColorName ?? "–"}`} hex={profile.rawColors.hairColor} />
                        )}
                      </div>
                    </ProfileRow>
                    <Divider />
                  </>
                )}

                {/* Row: Fitzpatrick skin type */}
                {profile.fitzpatrickType && (
                  <>
                    <ProfileRow label="Skin type">
                      <span className="font-serif" style={{ fontSize: "1.125rem", fontWeight: 400, color: "var(--color-charcoal)" }}>
                        {profile.fitzpatrickType}
                      </span>
                      {profile.fitzpatrickDescription && (
                        <p style={{ fontSize: "0.8125rem", color: "var(--color-slate)", marginTop: "0.35rem", fontWeight: 300 }}>
                          {profile.fitzpatrickDescription}
                        </p>
                      )}
                    </ProfileRow>
                    <Divider />
                  </>
                )}

                {/* Row: styling note */}
                <ProfileRow label="Styling profile">
                  <p style={{ fontSize: "0.9375rem", color: "var(--color-charcoal)", lineHeight: 1.7, fontWeight: 300 }}>
                    {profile.stylingNote}
                  </p>
                </ProfileRow>

                <Divider />

                {/* Row: colour palette */}
                <ProfileRow label="Recommended palette">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                    {profile.colourPalette.map(swatch => (
                      <div key={swatch.hex} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" }}>
                        <div style={{
                          width: "2rem", height: "2rem", borderRadius: "50%",
                          background: swatch.hex,
                          border: "1px solid rgba(0,0,0,0.1)",
                        }} />
                        <span style={{ fontSize: "0.625rem", color: "var(--color-slate)", letterSpacing: "0.06em", textTransform: "uppercase", textAlign: "center" }}>
                          {swatch.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </ProfileRow>
              </div>

              {/* CTA */}
              <div style={{ textAlign: "center", paddingTop: "1.5rem" }}>
                <Link href="/looks" style={{
                  display: "inline-block",
                  background: "var(--color-charcoal)", color: "#fff",
                  padding: "1rem 2.5rem",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.6875rem", fontWeight: 500,
                  letterSpacing: "0.18em", textTransform: "uppercase",
                  textDecoration: "none",
                  transition: "background 0.2s ease",
                }}>
                  Reveal My Looks →
                </Link>
                <p style={{ fontSize: "0.75rem", color: "var(--color-slate)", marginTop: "1rem", fontWeight: 300 }}>
                  We&rsquo;ll select three coordinated looks built around your profile.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProfileRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="layout-profile-row">
      <p className="eyebrow" style={{ paddingTop: "0.1rem", flexShrink: 0 }}>{label}</p>
      <div>{children}</div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: "1px", background: "var(--color-border)" }} />;
}

function ColorDot({ label, hex }: { label: string; hex: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <div style={{
        width: "1.25rem", height: "1.25rem", borderRadius: "50%",
        background: hex, border: "1px solid rgba(0,0,0,0.1)", flexShrink: 0,
      }} />
      <span style={{ fontSize: "0.8125rem", color: "var(--color-charcoal)" }}>{label}</span>
    </div>
  );
}

