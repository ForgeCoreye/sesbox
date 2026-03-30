"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { VoiceRecorder } from '../../components/VoiceRecorder';

type DraftResponse = {
  draftId?: string;
  id?: string;
};

export default function RecordPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [draftId, setDraftId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  const draftHref = useMemo(() => {
    return draftId ? `/draft/${draftId}` : null;
  }, [draftId]);

  const handleSuccess = (response: DraftResponse) => {
    const nextDraftId = response.draftId ?? response.id;
    if (!nextDraftId) {
      setError("Recording uploaded, but no draft ID was returned.");
      setDraftId(null);
      return;
    }

    setError(null);
    setDraftId(nextDraftId);
  };

  const handleError = (message: string) => {
    setError(message);
    setDraftId(null);
  };

  if (!isLoaded) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-6 py-12">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-12">
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-950">
            Record a voice note
          </h1>
          <p className="text-sm leading-6 text-gray-600">
            Capture your thoughts, upload the audio, and turn it into a draft.
          </p>
        </header>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <VoiceRecorder onSuccess={handleSuccess} onError={handleError} />
        </section>

        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        ) : null}

        {draftHref ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
            <p className="text-sm font-medium text-emerald-900">
              Draft created successfully.
            </p>
            <Link
              href={draftHref}
              className="mt-2 inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              View draft
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}