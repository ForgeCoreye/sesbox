import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio } from '../../../lib/transcription';

export const runtime = 'nodejs';

type DraftResponse = {
  transcription: string;
  draft: string;
  headline: string;
  bullets: string[];
};

function buildDraft(transcription: string): DraftResponse {
  const cleaned = transcription.trim();

  if (!cleaned) {
    return {
      transcription: '',
      draft: '',
      headline: 'Untitled draft',
      bullets: [],
    };
  }

  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const headlineSource = sentences[0] ?? cleaned;
  const headline = headlineSource
    .replace(/\s+/g, ' ')
    .replace(/[.!?]+$/g, '')
    .slice(0, 90);

  const bullets = sentences.slice(0, 5).map((sentence) =>
    sentence
      .replace(/\s+/g, ' ')
      .replace(/[.!?]+$/g, '')
      .slice(0, 140)
  );

  const draft = [
    `Headline: ${headline}`,
    '',
    'Summary:',
    cleaned.length > 280 ? `${cleaned.slice(0, 277)}...` : cleaned,
    '',
    'Key points:',
    ...bullets.map((bullet) => `- ${bullet}`),
  ].join('\n');

  return {
    transcription: cleaned,
    draft,
    headline,
    bullets,
  };
}

async function readAudioFile(formData: FormData): Promise<File> {
  const file = formData.get('audio');

  if (!file) {
    throw new Error('Missing audio file. Expected multipart/form-data field "audio".');
  }

  if (!(file instanceof File)) {
    throw new Error('Invalid audio file payload.');
  }

  if (!file.size) {
    throw new Error('Audio file is empty.');
  }

  return file;
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.toLowerCase().includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content-Type must be multipart/form-data.' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const audioFile = await readAudioFile(formData);

    const transcription = await transcribeAudio(audioFile);
    const draftResponse = buildDraft(transcription);

    return NextResponse.json(draftResponse, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    console.error('[api/draft] Failed to generate draft:', error);

    const status =
      message.includes('Missing audio file') || message.includes('Invalid audio file payload') || message.includes('empty')
        ? 400
        : 500;

    return NextResponse.json(
      {
        error: message,
        transcription: '',
        draft: '',
        headline: '',
        bullets: [],
      },
      { status }
    );
  }
}