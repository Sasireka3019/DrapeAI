"use client";

import { useState, useRef } from "react";

export default function TryOnTestPage() {
  const [garmentUrl, setGarmentUrl] = useState(
    "https://plugins-media.makeupar.com/strapi/assets/clothes_reference_full_body_01_5a000d999f.png"
  );
  const [category, setCategory] = useState("auto");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return alert("Select a user photo first");

    setStatus("loading");
    setResultUrl(null);
    setErrorMsg(null);

    const form = new FormData();
    form.append("userImage", file);
    form.append("garmentImageUrl", garmentUrl);
    form.append("garmentCategory", category);

    try {
      const res = await fetch("/api/youcam/tryon", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setResultUrl(json.resultUrl);
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  }

  return (
    <main style={{ maxWidth: 640, margin: "40px auto", padding: "0 20px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ marginBottom: 8 }}>Phase 1 — YouCam VTO PoC</h1>
      <p style={{ color: "#666", marginBottom: 24, fontSize: 14 }}>
        This page is a development proof-of-concept only. It will not appear in the final product.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <label>
          <span style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>
            User photo (full-body, single person)
          </span>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png" required />
        </label>

        <label>
          <span style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>
            Garment image URL
          </span>
          <input
            type="url"
            value={garmentUrl}
            onChange={(e) => setGarmentUrl(e.target.value)}
            style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "1px solid #ccc", borderRadius: 4 }}
            required
          />
        </label>

        <label>
          <span style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>
            Garment category
          </span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ padding: "8px 10px", fontSize: 13, border: "1px solid #ccc", borderRadius: 4 }}
          >
            <option value="auto">auto</option>
            <option value="full_body">full_body</option>
            <option value="upper_body">upper_body</option>
            <option value="lower_body">lower_body</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={status === "loading"}
          style={{
            padding: "10px 24px",
            background: status === "loading" ? "#999" : "#1a1a1a",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: status === "loading" ? "not-allowed" : "pointer",
            fontSize: 14,
            alignSelf: "flex-start",
          }}
        >
          {status === "loading" ? "Processing… (this may take ~20–40s)" : "Try On"}
        </button>
      </form>

      {status === "error" && (
        <div style={{ marginTop: 24, padding: 16, background: "#fee2e2", borderRadius: 6, color: "#991b1b" }}>
          <strong>Error:</strong> {errorMsg}
        </div>
      )}

      {status === "success" && resultUrl && (
        <div style={{ marginTop: 24 }}>
          <p style={{ fontWeight: 600, marginBottom: 12, color: "#166534" }}>✓ Try-on complete!</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resultUrl}
            alt="YouCam try-on result"
            style={{ width: "100%", borderRadius: 8, border: "1px solid #e5e7eb" }}
          />
          <p style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
            Result URL: <a href={resultUrl} target="_blank" rel="noreferrer" style={{ wordBreak: "break-all" }}>{resultUrl}</a>
          </p>
        </div>
      )}
    </main>
  );
}
