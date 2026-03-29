import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Sesbox — Voice Notes to Publishable Drafts',
    template: '%s | Sesbox',
  },
  description:
    'Turn your voice notes into clean, publishable drafts in seconds. The fastest way for solo creators to capture ideas and ship content.',
  keywords: [
    'voice notes',
    'creator tools',
    'content creation',
    'audio to text',
    'publishable drafts',
    'solo creator',
    'voice first',
  ],
  authors: [{ name: 'Sesbox' }],
  creator: 'Sesbox',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://sesbox.com'
  ),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Sesbox',
    title: 'Sesbox — Voice Notes to Publishable Drafts',
    description:
      'Turn your voice notes into clean, publishable drafts in seconds. Built for solo creators who think out loud.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sesbox — Voice Notes to Publishable Drafts',
    description:
      'Turn your voice notes into clean, publishable drafts in seconds. Built for solo creators who think out loud.',
    creator: '@sesbox',
  },
  robots: {
    index: true,
    follow: true,
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <div id="root-layout">
          {children}
        </div>
      </body>
    </html>
  );
}