"use client";

import React, { useCallback, useRef, useState } from "react";

type VoiceUploaderProps = {
  onTranscriptReady?: (transcript: string) => void;
  onError?: (error: Error) => void;
  onReset?: () => void;
};

export function VoiceUploader({ onTranscriptReady, onError }: VoiceUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("audio", file);

      const headers: Record<string, string> = {};
      const storedKey = typeof window !== "undefined"
        ? localStorage.getItem("sesbox_openai_key") ?? ""
        : "";
      if (storedKey) {
        headers["x-openai-key"] = storedKey;
      }

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
        headers,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Transcription failed");
      }
      const data = await res.json();
      onTranscriptReady?.(data.transcript);
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error("Upload failed"));
    } finally {
      setUploading(false);
    }
  }, [onTranscriptReady, onError]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div
        onClick={() => fileRef.current?.click()}
        style={{
          border: "2px dashed var(--border)",
          borderRadius: "var(--radius-md)",
          padding: "2.5rem 1.5rem",
          textAlign: "center",
          cursor: uploading ? "wait" : "pointer",
          background: "var(--surface)",
          transition: "border-color 160ms ease, background 160ms ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--accent)";
          e.currentTarget.style.background = "var(--accent-soft)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.background = "var(--surface)";
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept="audio/*"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          style={{ display: "none" }}
        />
        {uploading ? (
          <>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⏳</div>
            <p style={{ fontWeight: 600, color: "var(--accent)" }}>Transcribing…</p>
            <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: "0.25rem" }}>{fileName}</p>
          </>
        ) : (
          <>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🎙️</div>
            <p style={{ fontWeight: 600, color: "var(--text)" }}>
              Drop an audio file or click to upload
            </p>
            <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: "0.25rem" }}>
              MP3, WAV, WebM, M4A — up to 25 MB
            </p>
          </>
        )}
      </div>
      {fileName && !uploading && (
        <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Last file: {fileName}</p>
      )}
    </div>
  );
}

