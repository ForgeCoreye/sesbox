import OpenAI from 'openai';

export async function transcribeAudio(audioFile: File): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const openai = new OpenAI({ apiKey });

  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
    response_format: 'text',
  });

  const text = typeof transcription === 'string'
    ? transcription.trim()
    : (transcription as any).text?.trim() ?? '';

  return text;
}

export const transcribe = transcribeAudio;
