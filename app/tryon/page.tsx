"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

type TryOnStatus = "idle" | "uploading" | "processing" | "done" | "error";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TryOnPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: "var(--color-ivory)" }} />}>
      <TryOnContent />
    </Suspense>
  );
}

function TryOnContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [looks, setLooks]               = useState<RankedLook[] | null>(null);
  const [selectedLook, setSelectedLook] = useState<RankedLook | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoType, setPhotoType]       = useState<string>("image/jpeg");

  const [status, setStatus]     = useState<TryOnStatus>("idle");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg]   = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Read state from sessionStorage on mount
  useEffect(() => {
    const rawLooks   = sessionStorage.getItem("drape_looks");
    const photo      = sessionStorage.getItem("drape_photo_data_url");
    const type       = sessionStorage.getItem("drape_photo_type") ?? "image/jpeg";
    const lookIdParam = searchParams.get("lookId");

    if (!rawLooks || !photo) {
      router.replace("/onboarding");
      return;
    }

    const parsedLooks: RankedLook[] = JSON.parse(rawLooks);
    setLooks(parsedLooks);
    setPhotoDataUrl(photo);
    setPhotoType(type);

    // Prefer look from query param, fall back to stored selection, fall back to rank 1
    const target =
      (lookIdParam ? parsedLooks.find(l => l.id === lookIdParam) : null) ??
      (() => { try { return JSON.parse(sessionStorage.getItem("drape_selected_look") ?? "null"); } catch { return null; } })() ??
      parsedLooks[0];

    setSelectedLook(target ?? parsedLooks[0] ?? null);
  }, [router, searchParams]);

  // Trigger VTO whenever the selected look changes
  useEffect(() => {
    if (!selectedLook || !photoDataUrl) return;
    startTryOn(selectedLook, photoDataUrl, photoType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLook]);

  async function startTryOn(look: RankedLook, dataUrl: string, contentType: string) {
    // Cancel any in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setResultUrl(null);
    setErrorMsg(null);
    setStatus("uploading");

    try {
      // Convert data URL to Blob
      const base64 = dataUrl.replace(/^data:[^;]+;base64,/, "");
      const binary  = atob(base64);
      const bytes   = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: contentType });

      const form = new FormData();
      form.append("userImage",       new File([blob], "photo.jpg", { type: contentType }));
      form.append("garmentImageUrl", look.outfit.garmentImageUrl);
      form.append("garmentCategory", "auto");

      setStatus("processing");

      const res = await fetch("/api/youcam/tryon", {
        method: "POST",
        body: form,
        signal: abortRef.current.signal,
      });

      const data = await res.json();

      if (!res.ok || data.error) throw new Error(data.error ?? `Server error ${res.status}`);

      setResultUrl(data.resultUrl);
      setStatus("done");
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setErrorMsg(err instanceof Error ? err.message : "Try-on failed. Please retry.");
      setStatus("error");
    }
  }

  function switchLook(look: RankedLook) {
    if (look.id === selectedLook?.id) return;
    sessionStorage.setItem("drape_selected_look", JSON.stringify(look));
    setSelectedLook(look);
  }

  function retry() {
    if (!selectedLook || !photoDataUrl) return;
    startTryOn(selectedLook, photoDataUrl, photoType);
  }

  if (!looks || !selectedLook) return null;

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
          <span className="eyebrow">Virtual Try-On</span>
          <Link href="/looks" style={{ fontSize: "0.75rem", color: "var(--color-slate)", textDecoration: "none", letterSpacing: "0.08em" }}>
            ← Looks
          </Link>
        </div>
      </header>

      <main style={{ padding: "2.5rem 0 6rem" }}>
        <div style={cx}>

          {/* ── Two-column layout ──────────────────────────────────── */}
          <div className="layout-two-col-sidebar">

            {/* LEFT: Try-on viewer */}
            <div>
              <p className="eyebrow" style={{ marginBottom: "0.5rem" }}>Virtual Try-On</p>
              <h1 className="font-serif" style={{
                fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                fontWeight: 400, lineHeight: 1.15,
                color: "var(--color-charcoal)",
                marginBottom: "1.5rem",
              }}>
                See how {selectedLook.outfit.name} looks on you.
              </h1>

              {/* Viewer canvas */}
              <TryOnViewer
                status={status}
                resultUrl={resultUrl}
                errorMsg={errorMsg}
                originalPhotoDataUrl={photoDataUrl}
                onRetry={retry}
              />

              {/* Action strip below viewer */}
              {status === "done" && resultUrl && (
                <div style={{ marginTop: "1.25rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                  <Link
                    href="/enhance"
                    onClick={() => sessionStorage.setItem("drape_tryon_url", resultUrl)}
                    style={{
                      display: "inline-block",
                      background: "var(--color-charcoal)", color: "#fff",
                      padding: "0.875rem 2rem",
                      fontFamily: "var(--font-sans)",
                      fontSize: "0.6875rem", fontWeight: 500,
                      letterSpacing: "0.15em", textTransform: "uppercase",
                      textDecoration: "none",
                    }}
                  >
                    Complete My Look →
                  </Link>
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-slate)", fontWeight: 300 }}>
                    Add accessories, lip colour &amp; hairstyle suggestions
                  </p>
                </div>
              )}
            </div>

            {/* RIGHT: Look details + switcher */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

              {/* Selected look summary */}
              <div style={{ border: "1px solid var(--color-border)", background: "#fff", padding: "1.25rem" }}>
                <p className="eyebrow" style={{ marginBottom: "0.75rem" }}>Trying on</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedLook.outfit.image}
                  alt={selectedLook.outfit.name}
                  style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", marginBottom: "0.875rem" }}
                />
                <p className="font-serif" style={{ fontSize: "1rem", color: "var(--color-charcoal)", marginBottom: "0.25rem" }}>
                  {selectedLook.outfit.name}
                </p>
                <p style={{ fontSize: "0.8125rem", color: "var(--color-slate)" }}>
                  {selectedLook.outfit.outfitType} · {selectedLook.outfit.colour}
                </p>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-charcoal)", marginTop: "0.5rem" }}>
                  {formatINR(selectedLook.totalPriceINR)}
                  <span style={{ fontSize: "0.6875rem", fontWeight: 300, color: "var(--color-slate)", marginLeft: "0.35rem" }}>complete look</span>
                </p>
              </div>

              {/* Switch look */}
              {looks.length > 1 && (
                <div>
                  <p className="eyebrow" style={{ marginBottom: "0.75rem" }}>Try another look</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                    {looks.filter(l => l.id !== selectedLook.id).map(look => (
                      <button
                        key={look.id}
                        onClick={() => switchLook(look)}
                        disabled={status === "uploading" || status === "processing"}
                        style={{
                          display: "flex", alignItems: "center", gap: "0.75rem",
                          padding: "0.625rem",
                          background: "none",
                          border: "1px solid var(--color-border)",
                          cursor: status === "uploading" || status === "processing" ? "not-allowed" : "pointer",
                          textAlign: "left",
                          opacity: status === "uploading" || status === "processing" ? 0.5 : 1,
                          transition: "border-color 0.15s ease",
                          width: "100%",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={look.outfit.image}
                          alt={look.outfit.name}
                          style={{ width: "3.5rem", height: "4.5rem", objectFit: "cover", flexShrink: 0 }}
                        />
                        <div>
                          <p style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-charcoal)", marginBottom: "0.2rem" }}>
                            {look.outfit.name}
                          </p>
                          <p style={{ fontSize: "0.75rem", color: "var(--color-slate)" }}>
                            {formatINR(look.totalPriceINR)} · {Math.round(look.score * 100)}% match
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Note about VTO scope */}
              <div style={{
                padding: "0.875rem 1rem",
                background: "var(--color-ivory-dark)",
                border: "1px solid var(--color-border)",
                fontSize: "0.75rem", color: "var(--color-slate)", lineHeight: 1.65,
              }}>
                <strong style={{ color: "var(--color-charcoal)" }}>What you see:</strong> AI-generated outfit overlay on your photo.
                Accessories, lip colour, and hairstyle are shown as styling suggestions on the next screen.
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

// ─── Try-On Viewer ─────────────────────────────────────────────────────────────

function TryOnViewer({
  status,
  resultUrl,
  errorMsg,
  originalPhotoDataUrl,
  onRetry,
}: {
  status: TryOnStatus;
  resultUrl: string | null;
  errorMsg: string | null;
  originalPhotoDataUrl: string | null;
  onRetry: () => void;
}) {
  const [showOriginal, setShowOriginal] = useState(false);

  const aspectBox: React.CSSProperties = {
    width: "100%",
    aspectRatio: "3/4",
    maxHeight: "70vh",
    background: "var(--color-ivory-dark)",
    border: "1px solid var(--color-border)",
    overflow: "hidden",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  // ── Uploading / Processing ──────────────────────────────────────────────────
  if (status === "uploading" || status === "processing") {
    const label = status === "uploading" ? "Uploading photo…" : "AI is dressing you…";
    const sub   = status === "uploading"
      ? "Sending your photo securely"
      : "The AI is rendering the outfit on your photo. This takes 20–40 seconds.";

    return (
      <div style={aspectBox}>
        {/* Dimmed original photo in background */}
        {originalPhotoDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={originalPhotoDataUrl}
            alt=""
            aria-hidden
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.25 }}
          />
        )}
        {/* Overlay */}
        <div style={{ position: "relative", textAlign: "center", padding: "2rem" }}>
          <div style={{
            width: "3rem", height: "3rem",
            border: "2px solid rgba(201,168,76,0.3)",
            borderTopColor: "var(--color-gold)",
            borderRadius: "50%",
            animation: "spin 0.9s linear infinite",
            margin: "0 auto 1.5rem",
          }} />
          <p className="font-serif" style={{ fontSize: "1.125rem", color: "var(--color-charcoal)", marginBottom: "0.5rem" }}>
            {label}
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-slate)", fontWeight: 300, maxWidth: "18rem" }}>
            {sub}
          </p>
          {status === "processing" && (
            <ProcessingDots />
          )}
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (status === "error") {
    return (
      <div style={aspectBox}>
        <div style={{ textAlign: "center", padding: "2rem", maxWidth: "20rem" }}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚠️</div>
          <p className="font-serif" style={{ fontSize: "1rem", color: "var(--color-charcoal)", marginBottom: "0.5rem" }}>
            Try-on could not be completed
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-slate)", marginBottom: "1.5rem", fontWeight: 300, lineHeight: 1.65 }}>
            {errorMsg ?? "An unexpected error occurred."} This may happen if the photo does not show a full body.
          </p>
          <button
            onClick={onRetry}
            style={{
              background: "var(--color-charcoal)", color: "#fff",
              border: "none", padding: "0.75rem 1.75rem",
              fontFamily: "var(--font-sans)",
              fontSize: "0.6875rem", fontWeight: 500,
              letterSpacing: "0.15em", textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Retry →
          </button>
        </div>
      </div>
    );
  }

  // ── Idle (shouldn't normally show, but guard it) ────────────────────────────
  if (status === "idle") {
    return (
      <div style={aspectBox}>
        <p style={{ fontSize: "0.875rem", color: "var(--color-slate)" }}>Preparing…</p>
      </div>
    );
  }

  // ── Done ────────────────────────────────────────────────────────────────────
  return (
    <div>
      <div style={{ ...aspectBox, cursor: "pointer" }} onClick={() => setShowOriginal(v => !v)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={showOriginal && originalPhotoDataUrl ? originalPhotoDataUrl : resultUrl!}
          alt={showOriginal ? "Your original photo" : "Your virtual try-on result"}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        {/* Compare label */}
        <div style={{
          position: "absolute", bottom: "0.75rem", right: "0.75rem",
          background: "rgba(26,26,26,0.7)",
          color: "#fff",
          padding: "0.3rem 0.7rem",
          fontSize: "0.6875rem", fontWeight: 500,
          letterSpacing: "0.1em", textTransform: "uppercase",
          backdropFilter: "blur(4px)",
        }}>
          {showOriginal ? "Original" : "Try-on result"} · tap to compare
        </div>
      </div>
      <p style={{ fontSize: "0.75rem", color: "var(--color-slate)", marginTop: "0.5rem", textAlign: "center", fontWeight: 300 }}>
        Tap the image to compare with your original photo.
      </p>
    </div>
  );
}

// ─── Animated processing dots ─────────────────────────────────────────────────

function ProcessingDots() {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "center", gap: "0.4rem", marginTop: "1.25rem" }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: "0.5rem", height: "0.5rem",
            borderRadius: "50%",
            background: "var(--color-gold)",
            animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <style>{`
        @keyframes pulse-dot {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.8); }
          40%            { opacity: 1;    transform: scale(1.1); }
        }
      `}</style>
    </>
  );
}

