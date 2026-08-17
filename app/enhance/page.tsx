"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { RankedLook } from "@/types/catalog";

const cx: React.CSSProperties = {
  width: "100%",
  maxWidth: "52rem",
  marginLeft: "auto",
  marginRight: "auto",
  paddingLeft: "clamp(1.5rem, 4vw, 4rem)",
  paddingRight: "clamp(1.5rem, 4vw, 4rem)",
};

type StepStatus = "idle" | "processing" | "done" | "error" | "skipped";

interface Step {
  key: "lipstick" | "hairstyle";
  label: string;
  icon: string;
  description: string;
}

const STEPS: Step[] = [
  { key: "lipstick",  icon: "💄", label: "Lip Colour",   description: "Apply your recommended lip shade" },
  { key: "hairstyle", icon: "💇", label: "Hairstyle",    description: "Try your recommended hairstyle" },
];

export default function EnhancePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: "var(--color-ivory)" }} />}>
      <EnhanceContent />
    </Suspense>
  );
}

function EnhanceContent() {
  const router = useRouter();

  const [look, setLook]               = useState<RankedLook | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoType, setPhotoType]       = useState("image/jpeg");
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  const [stepIndex, setStepIndex]         = useState(0);
  const [stepStatuses, setStepStatuses]   = useState<StepStatus[]>(["idle", "idle"]);
  const [stepErrors, setStepErrors]       = useState<(string | null)[]>([null, null]);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const rawLook    = sessionStorage.getItem("drape_selected_look");
    const photo      = sessionStorage.getItem("drape_photo_data_url");
    const type       = sessionStorage.getItem("drape_photo_type") ?? "image/jpeg";
    const outfitUrl  = sessionStorage.getItem("drape_tryon_url");

    if (!rawLook || !photo) {
      router.replace("/tryon");
      return;
    }

    try {
      setLook(JSON.parse(rawLook));
      setPhotoDataUrl(photo);
      setPhotoType(type);
      // If we have an outfit VTO result, start from that; otherwise use the original photo
      setCurrentImage(outfitUrl ?? photo);
    } catch {
      router.replace("/tryon");
    }
  }, [router]);

  function blobFromDataUrl(dataUrl: string, contentType: string): File {
    const base64 = dataUrl.replace(/^data:[^;]+;base64,/, "");
    const binary  = atob(base64);
    const bytes   = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new File([bytes], "photo.jpg", { type: contentType });
  }

  async function applyStep(idx: number, imageUrl: string) {
    if (!look) return;
    const step = STEPS[idx];

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setStepStatuses(prev => { const n = [...prev]; n[idx] = "processing"; return n; });
    setStepErrors(prev => { const n = [...prev]; n[idx] = null; return n; });

    try {
      // Get the current image as a File to send to the API
      let imageFile: File;
      if (imageUrl.startsWith("data:")) {
        imageFile = blobFromDataUrl(imageUrl, photoType);
      } else {
        // Fetch external URL and convert to blob
        const resp = await fetch(imageUrl, { signal: abortRef.current.signal });
        const blob = await resp.blob();
        imageFile = new File([blob], "photo.jpg", { type: blob.type || "image/jpeg" });
      }

      const form = new FormData();
      form.append("userImage", imageFile);

      let endpoint = "";
      if (step.key === "lipstick") {
        endpoint = "/api/youcam/makeup";
        form.append("lipColorHex", look.lipstick.hexCode);
        form.append("finish", look.lipstick.finish);
      } else if (step.key === "hairstyle") {
        endpoint = "/api/youcam/hairstyle";
        const styleId = look.hairstyle.youcamStyleId ?? look.hairstyle.name.toLowerCase().replace(/\s+/g, "_");
        form.append("hairStyleId", styleId);
      }

      const res  = await fetch(endpoint, { method: "POST", body: form, signal: abortRef.current.signal });
      const data = await res.json();

      if (!res.ok || data.error) throw new Error(data.error ?? `Server error ${res.status}`);

      const resultUrl = data.resultUrl as string;
      setStepStatuses(prev => { const n = [...prev]; n[idx] = "done"; return n; });
      setCurrentImage(resultUrl);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Step failed";
      setStepErrors(prev => { const n = [...prev]; n[idx] = msg; return n; });
      setStepStatuses(prev => { const n = [...prev]; n[idx] = "error"; return n; });
    }
  }

  function skipStep(idx: number) {
    setStepStatuses(prev => { const n = [...prev]; n[idx] = "skipped"; return n; });
    if (idx < STEPS.length - 1) setStepIndex(idx + 1);
  }

  function proceedStep(idx: number) {
    if (idx < STEPS.length - 1) setStepIndex(idx + 1);
  }

  function finishLook() {
    if (currentImage) sessionStorage.setItem("drape_final_look_url", currentImage);
    router.push("/complete");
  }

  if (!look) return null;

  const allDone = STEPS.every((_, i) => stepStatuses[i] === "done" || stepStatuses[i] === "skipped");

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
          <span className="eyebrow">Enhance Your Look</span>
          <Link href="/tryon" style={{ fontSize: "0.75rem", color: "var(--color-slate)", textDecoration: "none", letterSpacing: "0.08em" }}>
            ← Try-On
          </Link>
        </div>
      </header>

      <main style={{ padding: "2.5rem 0 6rem" }}>
        <div style={cx}>

          {/* Step progress bar */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2.5rem" }}>
            {STEPS.map((s, i) => (
              <div
                key={s.key}
                onClick={() => i <= stepIndex && setStepIndex(i)}
                style={{
                  flex: 1, height: "3px",
                  backgroundColor: stepStatuses[i] === "done" ? "var(--color-gold)"
                    : stepStatuses[i] === "skipped" ? "var(--color-border)"
                    : i === stepIndex ? "var(--color-charcoal)"
                    : "var(--color-border)",
                  cursor: i <= stepIndex ? "pointer" : "default",
                  transition: "background-color 0.3s ease",
                }}
              />
            ))}
          </div>

          {/* Two-column layout */}
          <div className="layout-two-col-sidebar">

            {/* LEFT: Current look viewer */}
            <div>
              <p className="eyebrow" style={{ marginBottom: "0.5rem" }}>Your Look</p>
              <h1 className="font-serif" style={{
                fontSize: "clamp(1.25rem, 2.5vw, 2rem)",
                fontWeight: 400, lineHeight: 1.2,
                color: "var(--color-charcoal)", marginBottom: "1.5rem",
              }}>
                {allDone ? "Final Look 🎉" : `Step ${stepIndex + 1}: ${STEPS[stepIndex].label}`}
              </h1>

              {/* Image viewer */}
              <div style={{
                width: "100%", aspectRatio: "3/4",
                maxHeight: "70vh",
                border: "1px solid var(--color-border)",
                overflow: "hidden", position: "relative",
                background: "var(--color-ivory-dark)",
              }}>
                {currentImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentImage}
                    alt="Current look"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "0.875rem", color: "var(--color-slate)" }}>
                    Loading…
                  </div>
                )}
                {/* Processing overlay */}
                {STEPS.some((_, i) => stepStatuses[i] === "processing") && (
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "rgba(250,248,245,0.8)",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    gap: "1rem",
                  }}>
                    <div style={{
                      width: "2.5rem", height: "2.5rem",
                      border: "2px solid rgba(201,168,76,0.3)",
                      borderTopColor: "var(--color-gold)",
                      borderRadius: "50%",
                      animation: "spin 0.9s linear infinite",
                    }} />
                    <p className="font-serif" style={{ fontSize: "0.9375rem", color: "var(--color-charcoal)" }}>
                      Applying {STEPS.find((_, i) => stepStatuses[i] === "processing")?.label}…
                    </p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </div>
                )}
              </div>

              {/* Finish CTA */}
              {allDone && (
                <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <button
                    onClick={finishLook}
                    style={{
                      background: "var(--color-charcoal)", color: "#fff",
                      border: "none", padding: "0.875rem 2rem",
                      fontFamily: "var(--font-sans)",
                      fontSize: "0.6875rem", fontWeight: 500,
                      letterSpacing: "0.15em", textTransform: "uppercase",
                      cursor: "pointer",
                    }}
                  >
                    Complete My Look →
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT: Step cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {STEPS.map((step, idx) => {
                const status  = stepStatuses[idx];
                const errMsg  = stepErrors[idx];
                const isActive = idx === stepIndex;
                const isLocked = idx > stepIndex;
                const isDone   = status === "done";
                const isSkipped = status === "skipped";

                return (
                  <div
                    key={step.key}
                    style={{
                      border: `1px solid ${isActive ? "var(--color-charcoal)" : "var(--color-border)"}`,
                      background: isDone ? "rgba(201,168,76,0.05)" : "#fff",
                      padding: "1rem 1.25rem",
                      opacity: isLocked ? 0.45 : 1,
                      transition: "opacity 0.2s ease, border-color 0.2s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: isDone || errMsg ? "0.75rem" : "0.5rem" }}>
                      <span style={{ fontSize: "1.5rem" }}>{step.icon}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-charcoal)", marginBottom: "0.15rem" }}>
                          {step.label}
                          {isDone && <span style={{ marginLeft: "0.5rem", color: "var(--color-gold)", fontSize: "0.75rem" }}>✓ Applied</span>}
                          {isSkipped && <span style={{ marginLeft: "0.5rem", color: "var(--color-slate)", fontSize: "0.75rem" }}>Skipped</span>}
                        </p>
                        <p style={{ fontSize: "0.75rem", color: "var(--color-slate)" }}>{step.description}</p>
                      </div>
                    </div>

                    {/* Item preview */}
                    {isActive && (
                      <ItemPreview step={step.key} look={look!} />
                    )}

                    {errMsg && (
                      <p style={{ fontSize: "0.75rem", color: "#b91c1c", marginBottom: "0.75rem", lineHeight: 1.5 }}>
                        ⚠ {errMsg}
                      </p>
                    )}

                    {/* Action buttons */}
                    {isActive && !isDone && !isSkipped && (
                      <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.875rem" }}>
                        <button
                          onClick={() => applyStep(idx, currentImage ?? photoDataUrl ?? "")}
                          disabled={status === "processing" || !currentImage}
                          style={{
                            flex: 1,
                            background: "var(--color-charcoal)", color: "#fff",
                            border: "none", padding: "0.625rem 1rem",
                            fontFamily: "var(--font-sans)",
                            fontSize: "0.6875rem", fontWeight: 500,
                            letterSpacing: "0.12em", textTransform: "uppercase",
                            cursor: status === "processing" ? "not-allowed" : "pointer",
                            opacity: status === "processing" ? 0.6 : 1,
                          }}
                        >
                          {status === "processing" ? "Applying…" : errMsg ? "Retry" : "Apply →"}
                        </button>
                        <button
                          onClick={() => skipStep(idx)}
                          disabled={status === "processing"}
                          style={{
                            background: "none", color: "var(--color-slate)",
                            border: "1px solid var(--color-border)", padding: "0.625rem 1rem",
                            fontFamily: "var(--font-sans)",
                            fontSize: "0.6875rem", letterSpacing: "0.12em",
                            textTransform: "uppercase", cursor: "pointer",
                          }}
                        >
                          Skip
                        </button>
                      </div>
                    )}

                    {/* Next step button after done */}
                    {isDone && idx < STEPS.length - 1 && idx === stepIndex && (
                      <button
                        onClick={() => proceedStep(idx)}
                        style={{
                          marginTop: "0.5rem",
                          background: "none", color: "var(--color-charcoal)",
                          border: "1px solid var(--color-charcoal)", padding: "0.5rem 1.25rem",
                          fontFamily: "var(--font-sans)",
                          fontSize: "0.6875rem", fontWeight: 500,
                          letterSpacing: "0.12em", textTransform: "uppercase",
                          cursor: "pointer",
                          width: "100%",
                        }}
                      >
                        Next: {STEPS[idx + 1].label} →
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ItemPreview({ step, look }: { step: Step["key"]; look: RankedLook }) {
  if (step === "lipstick") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0" }}>
        <div style={{
          width: "2.25rem", height: "2.25rem", borderRadius: "50%",
          backgroundColor: look.lipstick.hexCode,
          border: "1px solid rgba(0,0,0,0.1)", flexShrink: 0,
        }} />
        <div>
          <p style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-charcoal)" }}>{look.lipstick.shadeName}</p>
          <p style={{ fontSize: "0.75rem", color: "var(--color-slate)" }}>{look.lipstick.finish}</p>
        </div>
      </div>
    );
  }

  if (step === "hairstyle") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0" }}>
        <div style={{
          width: "3rem", height: "3rem",
          background: "var(--color-ivory-dark)",
          border: "1px solid var(--color-border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.25rem", flexShrink: 0,
        }}>
          💇
        </div>
        <div>
          <p style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-charcoal)" }}>{look.hairstyle.name}</p>
          <p style={{ fontSize: "0.75rem", color: "var(--color-slate)" }}>{look.hairstyle.description}</p>
        </div>
      </div>
    );
  }

  return null;
}
