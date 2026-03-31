"use client";

import { useRouter } from "next/navigation";
import { WaitlistForm } from "../../components/WaitlistForm";

function SignupPage() {
  const router = useRouter();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Sign up</h1>
        <p className="mt-2 text-sm text-gray-600">
          Join for free and get notified when the next access batch opens.
        </p>
      </div>

      <WaitlistForm onSuccess={() => router.push("/thanks")} />

      <p className="mt-4 text-xs text-gray-500">
        No card required. We will email you when free access is available.
      </p>
    </main>
  );
}

export default SignupPage;