export type AudioCaptureSample = {
  timestamp: number;
  values: Float32Array;
};

export type AudioCaptureState = {
  stream: MediaStream;
  audioContext: AudioContext;
  analyser: AnalyserNode;
  sourceNode: MediaStreamAudioSourceNode;
  cleanup: () => Promise<void>;
  stop: () => Promise<void>;
  getSamples: () => Float32Array;
  getSampleData: () => AudioCaptureSample;
};

export type AudioCaptureOptions = {
  fftSize?: number;
  smoothingTimeConstant?: number;
  sampleRate?: number;
  onSamples?: (sample: AudioCaptureSample) => void;
};

export class AudioCaptureError extends Error {
  readonly name = "AudioCaptureError";
  readonly code:
    | "PERMISSION_DENIED"
    | "NOT_SUPPORTED"
    | "NO_DEVICE"
    | "START_FAILED"
    | "CLEANUP_FAILED";

  constructor(
    code:
      | "PERMISSION_DENIED"
      | "NOT_SUPPORTED"
      | "NO_DEVICE"
      | "START_FAILED"
      | "CLEANUP_FAILED",
    message: string,
    cause?: unknown,
  ) {
    super(message);
    this.code = code;
    if (cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = cause;
    }
  }
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof navigator !== "undefined";
}

function getAudioContextConstructor(): typeof AudioContext | null {
  if (!isBrowser()) return null;
  return window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext || null;
}

function createPermissionDeniedError(cause?: unknown): AudioCaptureError {
  return new AudioCaptureError(
    "PERMISSION_DENIED",
    "Microphone permission was denied or blocked.",
    cause,
  );
}

function createNotSupportedError(): AudioCaptureError {
  return new AudioCaptureError(
    "NOT_SUPPORTED",
    "Audio capture is not supported in this environment.",
  );
}

function createNoDeviceError(cause?: unknown): AudioCaptureError {
  return new AudioCaptureError(
    "NO_DEVICE",
    "No microphone device was found or accessible.",
    cause,
  );
}

function createStartFailedError(cause?: unknown): AudioCaptureError {
  return new AudioCaptureError(
    "START_FAILED",
    "Failed to start audio capture.",
    cause,
  );
}

function createCleanupFailedError(cause?: unknown): AudioCaptureError {
  return new AudioCaptureError(
    "CLEANUP_FAILED",
    "Failed to clean up audio capture resources.",
    cause,
  );
}

function isPermissionDeniedError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { name?: unknown; message?: unknown; code?: unknown };
  return (
    maybe.name === "NotAllowedError" ||
    maybe.name === "SecurityError" ||
    maybe.code === 1 ||
    (typeof maybe.message === "string" &&
      /denied|permission|blocked/i.test(maybe.message))
  );
}

function createSampleBuffer(analyser: AnalyserNode): Float32Array {
  const buffer = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(buffer);
  return buffer;
}

function createFallbackSampleBuffer(analyser: AnalyserNode): Float32Array {
  const buffer = new Float32Array(analyser.fftSize);
  analyser.getByteTimeDomainData(new Uint8Array(buffer.length));
  return buffer;
}

export async function startAudioCapture(
  options: AudioCaptureOptions = {},
): Promise<AudioCaptureState> {
  if (!isBrowser()) {
    throw createNotSupportedError();
  }

  const AudioContextCtor = getAudioContextConstructor();
  if (!AudioContextCtor) {
    throw createNotSupportedError();
  }

  const fftSize = options.fftSize ?? 2048;
  const smoothingTimeConstant = options.smoothingTimeConstant ?? 0.8;

  let stream: MediaStream | null = null;
  let audioContext: AudioContext | null = null;
  let sourceNode: MediaStreamAudioSourceNode | null = null;
  let analyser: AnalyserNode | null = null;
  let processorNode: ScriptProcessorNode | null = null;
  let stopped = false;

  const cleanup = async (): Promise<void> => {
    if (stopped) return;
    stopped = true;

    const cleanupErrors: unknown[] = [];

    try {
      processorNode?.disconnect();
    } catch (error) {
      cleanupErrors.push(error);
    }

    try {
      analyser?.disconnect();
    } catch (error) {
      cleanupErrors.push(error);
    }

    try {
      sourceNode?.disconnect();
    } catch (error) {
      cleanupErrors.push(error);
    }

    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch (error) {
      cleanupErrors.push(error);
    }

    try {
      if (audioContext && audioContext.state !== "closed") {
        await audioContext.close();
      }
    } catch (error) {
      cleanupErrors.push(error);
    }

    if (cleanupErrors.length > 0) {
      throw createCleanupFailedError(cleanupErrors[0]);
    }
  };

  const stop = async (): Promise<void> => {
    await cleanup();
  };

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      throw createPermissionDeniedError(error);
    }
    throw createNoDeviceError(error);
  }

  try {
    audioContext = new AudioContextCtor();
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    sourceNode = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = fftSize;
    analyser.smoothingTimeConstant = smoothingTimeConstant;

    sourceNode.connect(analyser);

    if (typeof audioContext.createScriptProcessor === "function") {
      processorNode = audioContext.createScriptProcessor(fftSize, 1, 1);
      processorNode.onaudioprocess = () => {
        if (!analyser || stopped) return;
        const values = createSampleBuffer(analyser);
        options.onSamples?.({
          timestamp: Date.now(),
          values,
        });
      };
      analyser.connect(processorNode);
      processorNode.connect(audioContext.destination);
    } else {
      const tick = () => {
        if (!analyser || stopped) return;
        const values = createSampleBuffer(analyser);
        options.onSamples?.({
          timestamp: Date.now(),
          values,
        });
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }

    const getSamples = (): Float32Array => {
      if (!analyser) return new Float32Array(0);
      try {
        return createSampleBuffer(analyser);
      } catch {
        return createFallbackSampleBuffer(analyser);
      }
    };

    const getSampleData = (): AudioCaptureSample => ({
      timestamp: Date.now(),
      values: getSamples(),
    });

    return {
      stream,
      audioContext,
      analyser,
      sourceNode,
      cleanup,
      stop,
      getSamples,
      getSampleData,
    };
  } catch (error) {
    try {
      await cleanup();
    } catch {
      // Preserve original error below.
    }
    throw createStartFailedError(error);
  }
}