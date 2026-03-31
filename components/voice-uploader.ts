"use client";

import React, { useCallback, useRef, useState } from "react";

type VoiceUploaderProps = {
  onTranscriptReady?: (transcript: string) => void;
  onError?: (error: Error) => void;
  onReset?: () => void;
};

export function VoiceUploader({ onTranscriptReady, onError }: VoiceUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("audio", file);
      const res = await fetch("/api/transcribe", { method: "POST", body: formData });
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

  return React.createElement("div", { className: "space-y-2" },
    React.createElement("input", {
      ref: fileRef,
      type: "file",
      accept: "audio/*",
      disabled: uploading,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
      },
    }),
    uploading && React.createElement("p", { className: "text-sm text-gray-500" }, "Transcribing…")
  );
}

