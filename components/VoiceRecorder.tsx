"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

type TranscribeResponse = {
  draftId?: string;
  transcript?: string;
  error?: string;
};

type VoiceRecorderProps = {
  onSuccess?: (result: { draftId?: string; transcript?: string }) => void;
  onError?: (error: string) => void;
  className?: string;
};

export default function VoiceRecorder({
  onSuccess,
  onError,
  className,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      cleanupStream();
    };
  }, [cleanupStream]);

  const handleError = useCallback(
    (message: string) => {
      setError(message);
      onError?.(message);
    },
    [onError]
  );

  const startRecording = useCallback(async () => {
    setError(null);
    setDraftId(null);
    setTranscript("");
    setAudioBlob(null);

    if (typeof window === "undefined") {
      handleError("Recording is only available in the browser.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      handleError("Your browser does not support audio recording.");
      return;
    }

    if (typeof MediaRecorder === "undefined") {
      handleError("MediaRecorder is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        handleError("An error occurred while recording audio.");
        setIsRecording(false);
        cleanupStream();
      };

      recorder.onstop = () => {
        try {
          const blob = new Blob(chunksRef.current, {
            type: recorder.mimeType || "audio/webm",
          });
          setAudioBlob(blob);
        } catch {
          handleError("Failed to process recorded audio.");
        } finally {
          chunksRef.current = [];
          cleanupStream();
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to access microphone. Please check permissions.";
      handleError(message);
      cleanupStream();
    }
  }, [cleanupStream, handleError]);

  const stopRecording = useCallback(() => {
    setError(null);

    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      handleError("No active recording to stop.");
      return;
    }

    try {
      recorder.stop();
      setIsRecording(false);
    } catch {
      handleError("Failed to stop recording.");
      setIsRecording(false);
      cleanupStream();
    }
  }, [cleanupStream, handleError]);

  const uploadAudio = useCallback(
    async (blob: Blob) => {
      setIsUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        const fileName = `voice-note-${Date.now()}.webm`;
        formData.append("audio", blob, fileName);

        const response = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        const data = (await response.json().catch(() => null)) as
          | TranscribeResponse
          | null;

        if (!response.ok) {
          throw new Error(
            data?.error || `Transcription failed with status ${response.status}.`
          );
        }

        const nextDraftId = data?.draftId ?? null;
        const nextTranscript = data?.transcript ?? "";

        setDraftId(nextDraftId);
        setTranscript(nextTranscript);

        onSuccess?.({
          draftId: nextDraftId ?? undefined,
          transcript: nextTranscript,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to upload audio.";
        handleError(message);
      } finally {
        setIsUploading(false);
      }
    },
    [handleError, onSuccess]
  );

  useEffect(() => {
    if (audioBlob) {
      void uploadAudio(audioBlob);
    }
  }, [audioBlob, uploadAudio]);

  return (
    <div className={className}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            disabled={isUploading}
            aria-label="Start recording"
          >
            Record
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            aria-label="Stop recording"
          >
            Stop
          </button>
        )}

        {isUploading ? <span>Uploading and transcribing…</span> : null}
      </div>

      {error ? (
        <p role="alert" style={{ color: "crimson", marginTop: 12 }}>
          {error}
        </p>
      ) : null}

      {draftId ? (
        <div style={{ marginTop: 12 }}>
          <p>
            <strong>Draft ID:</strong> {draftId}
          </p>
          {transcript ? (
            <p>
              <strong>Transcript:</strong> {transcript}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
export { VoiceRecorder }
