export default function ThanksPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">You&apos;re on the list.</h1>
        <p className="text-muted-foreground text-base">
          We&apos;ll reach out as soon as early access opens. Keep an eye on your inbox.
        </p>
        <p className="text-sm text-muted-foreground">
          In the meantime, share sesbox with a creator who records voice notes.
        </p>
        <a
          href="/"
          className="inline-block mt-4 text-sm font-medium underline underline-offset-4 hover:opacity-70 transition-opacity"
        >
          Back to home
        </a>
      </div>
    </main>
  );
}