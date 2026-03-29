"use client";

import { useState } from "react";

interface FormData {
  name: string;
  email: string;
  painPoint: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  painPoint?: string;
}

type SubmitStatus = "idle" | "loading" | "success" | "error";

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.name.trim()) {
    errors.name = "Name is required.";
  } else if (data.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters.";
  }

  if (!data.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }

  if (!data.painPoint.trim()) {
    errors.painPoint = "Please describe your workflow pain point.";
  } else if (data.painPoint.trim().length < 10) {
    errors.painPoint = "Please provide a bit more detail (at least 10 characters).";
  }

  return errors;
}

function hasErrors(errors: FormErrors): boolean {
  return Object.keys(errors).length > 0;
}

const EMPTY_FORM: FormData = { name: "", email: "", painPoint: "" };

export function WaitlistForm() {
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationErrors = validateForm(formData);
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmitStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          painPoint: formData.painPoint.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data?.message ?? `Request failed with status ${response.status}`
        );
      }

      setSubmitStatus("success");
      setFormData(EMPTY_FORM);
    } catch (err: unknown) {
      console.error("[WaitlistForm] submission error:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      setErrorMessage(message);
      setSubmitStatus("error");
    }
  }

  if (submitStatus === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          padding: "1.25rem",
          borderRadius: "0.5rem",
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          textAlign: "center",
          maxWidth: "420px",
        }}
      >
        <p style={{ margin: 0, fontWeight: 600, color: "#15803d" }}>
          You&apos;re on the list! 🎉
        </p>
        <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem", color: "#166534" }}>
          We&apos;ll reach out as soon as sesbox is ready.
        </p>
      </div>
    );
  }

  const isLoading = submitStatus === "loading";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Join the sesbox waitlist"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.875rem",
        maxWidth: "420px",
        width: "100%",
      }}
    >
      <Field
        id="wl-name"
        label="Name"
        name="name"
        type="text"
        autoComplete="name"
        placeholder="Your name"
        value={formData.name}
        error={errors.name}
        disabled={isLoading}
        onChange={handleChange}
      />

      <Field
        id="wl-email"
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={formData.email}
        error={errors.email}
        disabled={isLoading}
        onChange={handleChange}
      />

      <TextareaField
        id="wl-pain-point"
        label="Workflow pain point"
        name="painPoint"
        placeholder="e.g. I record voice notes but never turn them into posts…"
        value={formData.painPoint}
        error={errors.painPoint}
        disabled={isLoading}
        onChange={handleChange}
      />

      {submitStatus === "error" && errorMessage && (
        <p
          role="alert"
          style={{ margin: 0, fontSize: "0.8125rem", color: "#b91c1c" }}
        >
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        aria-busy={isLoading}
        style={{
          padding: "0.625rem 1.25rem",
          borderRadius: "0.375rem",
          border: "none",
          background: isLoading ? "#94a3b8" : "#6366f1",
          color: "#fff",
          fontWeight: 600,
          fontSize: "0.9375rem",
          cursor: isLoading ? "not-allowed" : "pointer",
          transition: "background 0.15s ease",
        }}
      >
        {isLoading ? "Submitting…" : "Join the waitlist"}
      </button>
    </form>
  );
}

interface FieldProps {
  id: string;
  label: string;
  name: string;
  type: string;
  autoComplete?: string;
  placeholder?: string;
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function Field({
  id,
  label,
  name,
  type,
  autoComplete,
  placeholder,
  value,
  error,
  disabled,
  onChange,
}: FieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      <label
        htmlFor={id}
        style={{ fontSize: "0.875rem", fontWeight: 500, color: "#374151" }}
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={onChange}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        style={{
          padding: "0.5rem 0.75rem",
          borderRadius: "0.375rem",
          border: error ? "1px solid #f87171" : "1px solid #d1d5db",
          fontSize: "0.9375rem",
          outline: "none",
          background: disabled ? "#f9fafb" : "#fff",
          color: "#111827",
        }}
      />
      {error && (
        <span
          id={`${id}-error`}
          role="alert"
          style={{ fontSize: "0.8125rem", color: "#b91c1c" }}
        >
          {error}
        </span>
      )}