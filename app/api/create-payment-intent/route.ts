import { NextRequest, NextResponse } from 'next/server';
import { createStripePaymentIntent } from '../../../lib/stripe';

type CreatePaymentIntentBody = {
  email?: unknown;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreatePaymentIntentBody;
    const email = isNonEmptyString(body?.email) ? body.email.trim() : '';

    if (!email) {
      return NextResponse.json(
        { clientSecret: '', error: 'Email is required.' },
        { status: 400 }
      );
    }

    console.log('[create-payment-intent] waitlist email:', email);

    const paymentIntent = await createStripePaymentIntent({
      amount: 0,
      currency: 'usd',
      receipt_email: email,
      metadata: {
        purpose: 'waitlist_signup',
        email,
      },
    });

    if (!paymentIntent?.clientSecret) {
      return NextResponse.json(
        { clientSecret: '', error: 'Unable to create payment intent.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      clientSecret: paymentIntent.clientSecret,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected error creating payment intent';

    console.error('[create-payment-intent] error:', message);

    return NextResponse.json(
      { clientSecret: '', error: 'Failed to create payment intent.' },
      { status: 500 }
    );
  }
}