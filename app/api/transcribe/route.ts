import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

type TranscriptResponse = {
  transcript: string;
  title: string;
};

function isFormData(value: unknown): value is FormData {
  return typeof value === 'object' && value !== null && typeof (value as FormData).get === 'function';
}

function getAudioFile(formData: FormData): File | null {
  const value = formData.get('audio');
  if (value instanceof File && value.size > 0) {
    return value;
  }
  return null;
}

function estimateDurationSeconds(file: File): number {
  const bytesPerSecond = 16000;
  const estimated = Math.max(1, Math.round(file.size / bytesPerSecond));
  return estimated;
}

function buildMockTranscript(durationSeconds: number): string {
  const minutes = Math.max(1, Math.round(durationSeconds / 60));
  if (minutes <= 1) {
    return 'Quick voice note about a draft idea, with a clear next step and a short action item.';
  }
  if (minutes <= 3) {
    return 'Voice note covering the main idea, a few supporting points, and a simple plan to move forward.';
  }
  return 'Longer voice note with multiple ideas, context, and a structured outline that can be turned into a publishable draft.';
}

function buildSuggestedTitle(durationSeconds: number): string {
  const minutes = Math.max(1, Math.round(durationSeconds / 60));
  if (minutes <= 1) return 'Quick Voice Note Draft';
  if (minutes <= 3) return 'Draft From Voice Note';
  return 'Voice Note Summary Draft';
}

function buildResponse(file: File): TranscriptResponse {
  const durationSeconds = estimateDurationSeconds(file);
  return {
    transcript: buildMockTranscript(durationSeconds),
    title: buildSuggestedTitle(durationSeconds),
  };
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Invalid input: expected multipart/form-data with an audio file.' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    if (!isFormData(formData)) {
      return NextResponse.json(
        { error: 'Invalid input: unable to read form data.' },
        { status: 400 }
      );
    }

    const audio = getAudioFile(formData);
    if (!audio) {
      return NextResponse.json(
        { error: 'Invalid input: audio file is required.' },
        { status: 400 }
      );
    }

    const payload = buildResponse(audio);

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error('Transcribe endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to process transcription request.' },
      { status: 500 }
    );
  }
}