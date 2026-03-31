# sesbox v1.0 Release Notes

## What’s included
- Real Whisper transcription for voice notes
- BYOK API key support for user-provided model access
- Warm cream/orange UI refresh
- Waitlist form for early access capture

## Removed
- Stripe payments
- Clerk auth

## Deployment
- Vercel-ready
- No env vars required for BYOK mode

## Notes
- Third-party SDK calls should stay behind local adapter modules in `lib/`
- Keep route and UI layers thin; centralize provider logic under `lib/`
- Use env placeholders only when configuration is needed