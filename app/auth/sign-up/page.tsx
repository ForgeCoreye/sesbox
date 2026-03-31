import { SignUp } from '@clerk/nextjs'

export const dynamic = 'force-dynamic'

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

export default function SignUpPage() {
  return (
    <main style={shellStyle}>
      <div style={wrapStyle}>
        <section>
          <p style={{ margin: 0, color: '#a84c1f', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: '0.8rem' }}>
            Join Sesbox
          </p>
          <h1 style={{ margin: '1rem 0', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', lineHeight: 1, letterSpacing: '-0.04em' }}>
            Create your account and start capturing ideas out loud.
          </h1>
          <p style={{ margin: 0, maxWidth: '42rem', color: '#6f6358', lineHeight: 1.7 }}>
            Once authenticated, you will land in a protected dashboard prepared for the next voice workflow tasks.
          </p>
        </section>
        <section style={cardStyle}>
          <SignUp forceRedirectUrl="/dashboard" signInUrl="/auth/sign-in" />
        </section>
      </div>
    </main>
  )
}
