import React from "react";

type WorkflowStepProps = {
  step: number;
  iconName: string;
  title: string;
  description: string;
  className?: string;
};

const ICONS: Record<string, React.ReactNode> = {
  record: (
    <path
      d="M12 14a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v4a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0M12 19v-2m-4 2h8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  transcribe: (
    <path
      d="M7 7h10M7 11h10M7 15h6M5 4.5h14A1.5 1.5 0 0 1 20.5 6v12A1.5 1.5 0 0 1 19 19.5H5A1.5 1.5 0 0 1 3.5 18V6A1.5 1.5 0 0 1 5 4.5Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  export: (
    <path
      d="M12 3v10m0 0 4-4m-4 4-4-4M5 14v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  draft: (
    <path
      d="M4 19h16M7 16l9-9a1.5 1.5 0 0 1 2.12 0l.88.88a1.5 1.5 0 0 1 0 2.12l-9 9H7v-3Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
};

function getIcon(iconName: string): React.ReactNode {
  return ICONS[iconName.toLowerCase()] ?? (
    <path
      d="M12 6v6l4 2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function cn(...classes: Array<string | undefined | false | null>): string {
  return classes.filter(Boolean).join(" ");
}

export default function WorkflowStep({
  step,
  iconName,
  title,
  description,
  className,
}: WorkflowStepProps) {
  const safeStep = Number.isFinite(step) && step > 0 ? Math.floor(step) : 1;
  const safeTitle = typeof title === "string" && title.trim().length > 0 ? title : "Untitled step";
  const safeDescription =
    typeof description === "string" && description.trim().length > 0
      ? description
      : "No description provided.";

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all duration-200",
        "hover:border-primary/30 hover:shadow-md",
        "sm:p-6",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
            >
              {getIcon(iconName)}
            </svg>
          </div>

          <div className="flex h-8 min-w-8 items-center justify-center rounded-full bg-muted px-2 text-sm font-semibold text-foreground/80 ring-1 ring-border/60">
            {safeStep}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold leading-6 tracking-tight text-foreground sm:text-lg">
            {safeTitle}
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-[15px]">
            {safeDescription}
          </p>
        </div>
      </div>
    </article>
  );
}