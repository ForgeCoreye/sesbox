"use client";

import { useEffect, useState } from "react";

export function ApiKeyInput() {
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sesbox_openai_key") ?? "";
    setKey(stored);
  }, []);

  const handleSave = () => {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem("sesbox_openai_key", trimmed);
    } else {
      localStorage.removeItem("sesbox_openai_key");
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <details className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <summary className="cursor-pointer text-sm font-medium text-gray-700 select-none">
        OpenAI API Key Settings
      </summary>
      <div className="mt-3 space-y-2">
        <p className="text-xs text-gray-500">
          Your key is stored only in your browser and sent directly to OpenAI.
        </p>
        <div className="flex gap-2">
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="sk-..."
            className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-black px-3 py-1.5 text-sm text-white hover:bg-gray-800"
          >
            {saved ? "Saved ✓" : "Save"}
          </button>
        </div>
      </div>
    </details>
  );
}
