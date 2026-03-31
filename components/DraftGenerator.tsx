"use client";

import React, { useMemo, useState } from "react";

type DraftResponse = {
  transcription?: string;
  draft?: string;
  headline?: string;
  bullets?: string[];
  error?: string;
};

type Status = "idle" | "loading" | "success" | "error";

function isFileLike(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

function normalizeBullets(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return "Something went wrong while generating the draft.";
}

export default function DraftGenerator() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");
  const [transcription, setTranscription] = useState<string>("");
  const [headline, setHeadline] = useState<string>("");
  const [bullets, setBullets] = useState<string[]>([]);
  const [draft, setDraft] = useState<string>("");

  const canSubmit = useMemo(() => isFileLike(audioFile), [audioFile]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!audioFile) {
      setError("Please choose an audio file first.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setError("");
    setTranscription("");
    setHeadline("");
    setBullets([]);
    setDraft("");

    try {
      const formData = new FormData();
      formData.append("audio", audioFile);

      const response = await fetch("/api/draft", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as DraftResponse | null;

      if (!response.ok) {
        throw new Error(payload?.error || `Request failed with status ${response.status}.`);
      }

      const nextTranscription = typeof payload?.transcription === "string" ? payload.transcription : "";
      const nextHeadline = typeof payload?.headline === "string" ? payload.headline : "";
      const nextBullets = normalizeBullets(payload?.bullets);
      const nextDraft = typeof payload?.draft === "string" ? payload.draft : "";

      setTranscription(nextTranscription);
      setHeadline(nextHeadline);
      setBullets(nextBullets);
      setDraft(nextDraft);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(getErrorMessage(err));
    }
  }

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">Generate a draft from voice</h2>
        <p className="mt-2 text-sm text-slate-600">
          Upload an audio note to transcribe it and generate a publishable draft outline.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Audio file</span>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
            className="block w-full cursor-pointer rounded-lg border border-slate-300 bg-white text-sm text-slate-700 file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
          />
        </label>

        <button
          type="submit"
          disabled={!canSubmit || status === "loading"}
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? (
            <span className="inline-flex items-center gap-2">
              <Spinner />
              Generating...
            </span>
          ) : (
            "Generate draft"
          )}
        </button>
      </form>

      {status === "error" && error ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {status === "success" ? (
        <div className="mt-6 space-y-6">
          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Transcription</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
              {transcription || "No transcription returned."}
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Draft output</h3>

            <div className="mt-3">
              <h4 className="text-xl font-semibold text-slate-900">
                {headline || "Untitled draft"}
              </h4>

              {bullets.length > 0 ? (
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
                  {bullets.map((bullet, index) => (
                    <li key={`${bullet}-${index}`}>{bullet}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-slate-600">No bullet points returned.</p>
              )}

              {draft ? (
                <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  {draft}
                </div>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
    />
  );
}