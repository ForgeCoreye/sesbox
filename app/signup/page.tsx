"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

type CreatePaymentIntentResponse = {
  clientSecret?: string;
  error?: string;
};

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
);

function SignupPage() {
  const [email, setEmail] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const appearance = useMemo(
    () => ({
      theme: "stripe" as const,
    }),
    []
  );

  const options = useMemo(
    () =>
      clientSecret
        ? {
            clientSecret,
            appearance,
          }
        : null,
    [clientSecret, appearance]
  );

  async function handleCreateIntent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    setLoadingIntent(true);
    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = (await res.json().catch(() => ({}))) as CreatePaymentIntentResponse;

      if (!res.ok) {
        throw new Error(data.error || "Unable to start payment setup.");
      }

      if (!data.clientSecret) {
        throw new Error("Payment setup did not return a client secret.");
      }

      setClientSecret(data.clientSecret);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoadingIntent(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Sign up</h1>
        <p className="mt-2 text-sm text-gray-600">
          Enter your email and complete a payment authorization to continue.
        </p>
      </div>

      {!clientSecret ? (
        <form onSubmit={handleCreateIntent} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none ring-0 focus:border-black"
              required
            />
          </div>

          {error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loadingIntent}
            className="w-full rounded-md bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingIntent ? "Preparing payment..." : "Continue to payment"}
          </button>
        </form>
      ) : (
        <Elements
          stripe={stripePromise}
          options={options ?? undefined}
          key={clientSecret}
        >
          <PaymentForm email={email} clientSecret={clientSecret} />
        </Elements>
      )}
    </main>
  );
}

function PaymentForm({
  email,
  clientSecret,
}: {
  email: string;
  clientSecret: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!stripe || !elements) {
      setError("Payment form is still loading. Please try again.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/app`,
          payment_method_data: {
            billing_details: {
              email,
            },
          },
        },
        redirect: "if_required",
      });

      if (result.error) {
        throw new Error(result.error.message || "Payment failed.");
      }

      router.push("/app");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium">Card details</label>
        <div className="rounded-md border border-gray-300 px-3 py-3">
          <PaymentElement />
        </div>
      </div>

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full rounded-md bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Processing..." : "Complete signup"}
      </button>
    </form>
  );
}

export default SignupPage;