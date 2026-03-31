"use client";

import { useEffect, useState } from "react";

export function ApiKeyInput() {
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sesbox_openai_key") ?? "";
    setKey(stored);
  }, []);

  const handleSave = () => {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem("sesbox_openai_key", trimmed);
    } else {
      localStorage.removeItem("sesbox_openai_key");
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <details style={{
      borderRadius: "var(--radius-lg)",
      border: "1px solid var(--border)",
      background: "rgba(255,255,255,0.72)",
      backdropFilter: "blur(10px)",
      padding: "1.25rem 1.5rem",
      boxShadow: "var(--shadow)",
    }}>
      <summary style={{
        cursor: "pointer",
        fontSize: "0.92rem",
        fontWeight: 600,
        color: "var(--muted)",
        userSelect: "none",
      }}>
        🔑 OpenAI API Key Settings
      </summary>
      <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <p style={{ fontSize: "0.82rem", color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>
          Your key is stored only in your browser and sent directly to OpenAI. We never see or store it.
        </p>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="sk-..."
            style={{
              flex: 1,
              minHeight: "2.6rem",
              padding: "0 1rem",
              borderRadius: "999px",
              border: "1px solid var(--border)",
              background: "var(--surface-strong)",
              fontSize: "0.9rem",
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={handleSave}
            className="btn btn--primary"
            style={{
              minHeight: "2.6rem",
              padding: "0 1.2rem",
              fontSize: "0.85rem",
            }}
          >
            {saved ? "Saved ✓" : "Save"}
          </button>
        </div>
      </div>
    </details>
  );
}
