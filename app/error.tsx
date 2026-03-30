'use client';

import Link from 'next/link';
import { useEffect } from 'react';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

function getFriendlyMessage(error: Error): string {
  const message = error?.message?.trim();
  if (!message) {
    return 'Something went wrong while loading this page.';
  }

  if (message.length > 180) {
    return `${message.slice(0, 180)}...`;
  }

  return message;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    try {
      const logger = {
        error: (...args: unknown[]) => {
          if (typeof console !== 'undefined' && typeof console.error === 'function') {
            console.error(...args);
          }
        },
      };

      logger.error('App error boundary triggered', {
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
        digest: error?.digest,
      });
    } catch {
      // Intentionally swallow logging failures to avoid blocking recovery UI.
    }
  }, [error]);

  const friendlyMessage = getFriendlyMessage(error);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        color: '#0f172a',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          background: '#ffffff',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
          padding: '32px',
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: '#ef4444',
            }}
          >
            Something went wrong
          </p>
          <h1 style={{ margin: '8px 0 0', fontSize: '28px', lineHeight: 1.2 }}>
            We couldn&apos;t load this page
          </h1>
        </div>

        <p style={{ margin: '0 0 16px', fontSize: '16px', lineHeight: 1.6, color: '#334155' }}>
          {friendlyMessage}
        </p>

        {error?.digest ? (
          <p style={{ margin: '0 0 24px', fontSize: '13px', color: '#64748b' }}>
            Reference code: <span style={{ fontFamily: 'monospace' }}>{error.digest}</span>
          </p>
        ) : null}

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            onClick={() => reset()}
            style={{
              appearance: 'none',
              border: 'none',
              borderRadius: '10px',
              background: '#0f172a',
              color: '#ffffff',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>

          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#0f172a',
              textDecoration: 'none',
              background: '#ffffff',
            }}
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}