"use client";

import React from "react";

type DraftCardProps = {
  transcript: string;
  onReset?: () => void;
};

export function DraftCard({ transcript, onReset }: DraftCardProps) {
  if (!transcript) return null;

  const sentences = transcript.split(/(?<=[.!?])\s+/).filter(Boolean);
  const headline = sentences[0]?.replace(/[.!?]+$/, "").slice(0, 80) || "Untitled Draft";
  const bullets = sentences.slice(0, 5);

  return React.createElement("div", { className: "rounded-lg border p-4 space-y-3" },
    React.createElement("h3", { className: "text-lg font-semibold" }, headline),
    React.createElement("ul", { className: "list-disc pl-5 space-y-1" },
      ...bullets.map((b, i) => React.createElement("li", { key: i, className: "text-sm" }, b))
    ),
    React.createElement("div", { className: "flex gap-2 pt-2" },
      React.createElement("button", {
        onClick: () => navigator.clipboard.writeText(transcript),
        className: "text-sm underline"
      }, "Copy transcript"),
      onReset && React.createElement("button", {
        onClick: onReset,
        className: "text-sm underline"
      }, "New recording")
    )
  );
}
