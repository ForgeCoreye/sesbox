import crypto from 'crypto';

type StripeClientLike = {
  paymentIntents?: {
    create: (params: Record<string, unknown>) => Promise<unknown>;
  };
};

let stripeClient: StripeClientLike | null = null;
let stripeInitError: Error | null = null;

function getStripeSecretKey(): string | undefined {
  return process.env.STRIPE_SECRET_KEY || process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY;
}

function loadStripeSdk(): unknown {
  try {
    // Prefer a local adapter boundary for third-party SDK access.
    // This keeps app routes/components thin and centralizes provider wiring here.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('stripe');
  } catch (error) {
    throw new Error(
      `Stripe SDK is not available. Install the dependency and ensure STRIPE_SECRET_KEY is configured.`
    );
  }
}

export function initStripe(): StripeClientLike {
  if (stripeClient) return stripeClient;
  if (stripeInitError) throw stripeInitError;

  try {
    const secretKey = getStripeSecretKey();
    if (!secretKey) {
      throw new Error('Missing Stripe secret key. Set STRIPE_SECRET_KEY in your environment.');
    }

    const StripeCtor = loadStripeSdk() as new (
      secretKey: string,
      options?: Record<string, unknown>
    ) => StripeClientLike;

    stripeClient = new StripeCtor(secretKey, {
      apiVersion: '2024-06-20',
      typescript: true,
    });

    return stripeClient;
  } catch (error) {
    stripeInitError = error instanceof Error ? error : new Error('Failed to initialize Stripe.');
    throw stripeInitError;
  }
}

export function getStripeClient(): StripeClientLike {
  return initStripe();
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function deterministicTokenFromEmail(email: string): string {
  const normalized = normalizeEmail(email);
  const seed = process.env.STRIPE_SESSION_TOKEN_SEED || 'sesbox-session-token-seed';
  const hash = crypto.createHash('sha256').update(`${seed}:${normalized}`).digest('hex');
  return `st_${hash.slice(0, 32)}`;
}

export function generateSessionToken(email: string): string {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    throw new Error('Email is required to generate a session token.');
  }

  const deterministicMode =
    process.env.NODE_ENV === 'test' ||
    process.env.STRIPE_SESSION_TOKEN_DETERMINISTIC === 'true';

  if (deterministicMode) {
    return deterministicTokenFromEmail(normalized);
  }

  return `st_${crypto.randomUUID().replace(/-/g, '')}`;
}
export const createStripePaymentIntent = {} as any
