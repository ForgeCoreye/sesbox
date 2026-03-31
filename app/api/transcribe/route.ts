import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB (Whisper limit)

function getAudioFile(formData: FormData): File | null {
  const value = formData.get('audio');
  if (value instanceof File && value.size > 0) {
    return value;
  }
  return null;
}

function buildTitle(transcript: string): string {
  const cleaned = transcript.replace(/\s+/g, ' ').trim();
  const firstSentence = cleaned.split(/[.!?]/)[0]?.trim() ?? cleaned;
  if (firstSentence.length <= 60) return firstSentence;
  return firstSentence.slice(0, 57) + '...';
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Server configuration error: OPENAI_API_KEY is not set.' },
        { status: 500 }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Invalid input: expected multipart/form-data with an audio file.' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const audio = getAudioFile(formData);
    if (!audio) {
      return NextResponse.json(
        { error: 'Invalid input: audio file is required.' },
        { status: 400 }
      );
    }

    if (audio.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024} MB.` },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey });

    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: 'whisper-1',
      response_format: 'text',
    });

    const transcript = typeof transcription === 'string'
      ? transcription.trim()
      : (transcription as any).text?.trim() ?? '';

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcription returned empty result. Please try again with clearer audio.' },
        { status: 422 }
      );
    }

    return NextResponse.json({
      transcript,
      title: buildTitle(transcript),
    }, { status: 200 });
  } catch (error: any) {
    console.error('Transcribe endpoint error:', error);

    if (error?.status === 401) {
      return NextResponse.json(
        { error: 'Invalid API key. Check your OPENAI_API_KEY configuration.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process transcription request.' },
      { status: 500 }
    );
  }
}