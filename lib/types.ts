export interface Draft {
  id: string;
  transcript: string;
  createdAt: string;
  userId: string;
}

export interface TranscriptResponse {
  draftId: string;
  transcript: string;
  createdAt: string;
}

export interface ApiErrorResponse {
  error: string;
  message?: string;
  details?: unknown;
}

export interface TranscribeRequestPayload {
  audio?: Blob | File | ArrayBuffer | Uint8Array | string | null;
  userId?: string;
}

export interface CreateDraftPayload {
  transcript: string;
  userId: string;
}

export interface UpdateDraftPayload {
  transcript?: string;
  userId?: string;
}

export interface ListDraftsResponse {
  drafts: Draft[];
}

export type DraftId = Draft["id"];
export type UserId = Draft["userId"];