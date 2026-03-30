import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

const shellStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: '#16120f',
  color: '#f5efe7',
  padding: '3rem 1.5rem',
}

const wrapStyle: React.CSSProperties = {
  width: 'min(100%, 1120px)',
  margin: '0 auto',
  display: 'grid',
  gap: '1.5rem',
}

const cardStyle: React.CSSProperties = {
  borderRadius: '24px',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.04)',
  padding: '1.5rem',
}

const mutedStyle: React.CSSProperties = {
  color: 'rgba(245,239,231,0.72)',
  lineHeight: 1.7,
}

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/auth/sign-in')
  }

  return (
    <main style={shellStyle}>
      <div style={wrapStyle}>
        <section style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: 0, color: '#f7b08a', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: '0.8rem' }}>
              Protected dashboard
            </p>
            <h1 style={{ margin: '1rem 0 0.75rem', fontSize: 'clamp(2.2rem, 5vw, 4rem)', lineHeight: 1, letterSpacing: '-0.04em' }}>
              Welcome to Sesbox
            </h1>
            <p style={{ ...mutedStyle, maxWidth: '44rem', margin: 0 }}>
              Authentication is now active. This private area will host voice capture, transcript review, and publishing workflow steps.
            </p>
            <div style={{ marginTop: '1.25rem', padding: '0.85rem 1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.16)' }}>
              Signed in user id: <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', color: '#ffd6c2' }}>{userId}</span>
            </div>
          </div>
          <div style={{ alignSelf: 'flex-start', padding: '0.75rem 1rem', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.16)' }}>
            <UserButton afterSignOutUrl="/" />
          </div>
        </section>

        <section style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          <article style={cardStyle}>
            <p style={{ margin: 0, color: '#f7b08a', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', fontSize: '0.78rem' }}>
              Next milestone
            </p>
            <h2 style={{ margin: '1rem 0 0.75rem', fontSize: '1.75rem' }}>Voice capture</h2>
            <p style={{ ...mutedStyle, margin: 0 }}>
              The next approved task will add the browser recording flow and local transcription pipeline here.
            </p>
            <Link href="/" style={{ display: 'inline-flex', marginTop: '1.5rem', padding: '0.8rem 1rem', borderRadius: '999px', border: '1px solid rgba(247,176,138,0.4)', color: '#ffd6c2' }}>
              Back to landing page
            </Link>
          </article>
          <article style={cardStyle}>
            <p style={{ margin: 0, color: '#f7b08a', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', fontSize: '0.78rem' }}>
              System status
            </p>
            <ul style={{ margin: '1rem 0 0', paddingLeft: '1.25rem', ...mutedStyle }}>
              <li>Auth middleware protects dashboard routes.</li>
              <li>Clerk session context is available in the app shell.</li>
              <li>Private dashboard is ready for the next voice workflow tasks.</li>
            </ul>
          </article>
        </section>
      </div>
    </main>
  )
}
