export type TranscribeRequest = {
  audio: Blob;
  filename?: string | null;
  language?: string | null;
  userId?: string | null;
};

export type TranscribeResponse = {
  transcript: string;
  success: boolean;
  error?: string | null;
};