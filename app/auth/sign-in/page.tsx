import { SignIn } from '@clerk/nextjs'

const shellStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: '#f6f1ea',
  color: '#1c1814',
  padding: '4rem 1.5rem',
}

const wrapStyle: React.CSSProperties = {
  width: 'min(100%, 1100px)',
  margin: '0 auto',
  display: 'grid',
  gap: '2rem',
  alignItems: 'center',
}

const cardStyle: React.CSSProperties = {
  borderRadius: '24px',
  border: '1px solid #e7ddd2',
  background: '#fffaf4',
  padding: '1rem',
  boxShadow: '0 18px 48px rgba(28, 24, 20, 0.08)',
}

export default function SignInPage() {
  return (
    <main style={shellStyle}>
      <div style={wrapStyle}>
        <section>
          <p style={{ margin: 0, color: '#a84c1f', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: '0.8rem' }}>
            Sesbox access
          </p>
          <h1 style={{ margin: '1rem 0', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', lineHeight: 1, letterSpacing: '-0.04em' }}>
            Sign in to continue your voice-to-draft workflow.
          </h1>
          <p style={{ margin: 0, maxWidth: '42rem', color: '#6f6358', lineHeight: 1.7 }}>
            Create an account or sign in to unlock the protected dashboard and the upcoming recording workflow.
          </p>
        </section>
        <section style={cardStyle}>
          <SignIn forceRedirectUrl="/dashboard" signUpUrl="/auth/sign-up" />
        </section>
      </div>
    </main>
  )
}
