"use client";

import React, { useState } from "react";

type DraftCardProps = {
  transcript: string;
  onReset?: () => void;
};

export function DraftCard({ transcript, onReset }: DraftCardProps) {
  const [copied, setCopied] = useState(false);

  if (!transcript) return null;

  const sentences = transcript.split(/(?<=[.!?])\s+/).filter(Boolean);
  const headline = sentences[0]?.replace(/[.!?]+$/, "").slice(0, 80) || "Untitled Draft";
  const bullets = sentences.slice(0, 5);

  const handleCopy = () => {
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "var(--text)" }}>
        {headline}
      </h3>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {bullets.map((b, i) => (
          <li key={i} style={{
            padding: "0.6rem 0.9rem",
            background: "var(--surface)",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.92rem",
            lineHeight: 1.6,
            color: "var(--text)",
            borderLeft: "3px solid var(--accent-soft)",
          }}>
            {b}
          </li>
        ))}
      </ul>
      <div style={{
        display: "flex",
        gap: "0.75rem",
        paddingTop: "0.5rem",
        borderTop: "1px solid var(--border)",
      }}>
        <button
          onClick={handleCopy}
          style={{
            padding: "0.6rem 1.2rem",
            borderRadius: "999px",
            border: "1px solid var(--border)",
            background: copied ? "var(--accent-soft)" : "var(--surface-strong)",
            fontWeight: 600,
            fontSize: "0.85rem",
            cursor: "pointer",
            transition: "all 160ms ease",
          }}
        >
          {copied ? "Copied ✓" : "Copy transcript"}
        </button>
        {onReset && (
          <button
            onClick={onReset}
            style={{
              padding: "0.6rem 1.2rem",
              borderRadius: "999px",
              border: "none",
              background: "var(--accent)",
              color: "white",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: "pointer",
              transition: "all 160ms ease",
            }}
          >
            New recording
          </button>
        )}
      </div>
    </div>
  );
}
