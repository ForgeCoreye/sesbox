"use client"

import { useState } from 'react'

type FormData = {
  name: string
  email: string
  painPoint: string
}

type FormErrors = Partial<Record<keyof FormData, string>>

type SubmitState = 'idle' | 'loading' | 'success' | 'error'

const EMPTY_FORM: FormData = {
  name: '',
  email: '',
  painPoint: '',
}

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {}

  if (!data.name.trim()) errors.name = 'Name is required.'
  if (!data.email.trim()) errors.email = 'Email is required.'
  if (data.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = 'Please enter a valid email address.'
  }
  if (!data.painPoint.trim()) errors.painPoint = 'Please describe your workflow pain point.'

  return errors
}

export function WaitlistForm() {
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [message, setMessage] = useState('')

  const isLoading = submitState === 'loading'

  function updateField(name: keyof FormData, value: string) {
    setFormData((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateForm(formData)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setSubmitState('loading')
    setMessage('')

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          painPoint: formData.painPoint.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error('Request failed with status ' + response.status)
      }

      setSubmitState('success')
      setFormData(EMPTY_FORM)
      setMessage('You are on the list. We will reach out when Sesbox opens new spots.')
    } catch (error) {
      console.error('[WaitlistForm] submission error', error)
      setSubmitState('error')
      setMessage('Something went wrong. Please try again in a minute.')
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: 'grid', gap: '0.9rem', maxWidth: '420px', width: '100%' }}>
      <Field label="Name" name="name" type="text" value={formData.name} error={errors.name} disabled={isLoading} onChange={updateField} />
      <Field label="Email" name="email" type="email" value={formData.email} error={errors.email} disabled={isLoading} onChange={updateField} />
      <TextareaField label="Workflow pain point" name="painPoint" value={formData.painPoint} error={errors.painPoint} disabled={isLoading} onChange={updateField} />
      {message ? (
        <p role={submitState === 'error' ? 'alert' : 'status'} style={{ margin: 0, color: submitState === 'error' ? '#b42318' : '#166534', fontSize: '0.92rem' }}>
          {message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isLoading}
        style={{ minHeight: '3rem', borderRadius: '999px', border: 'none', background: isLoading ? '#d0c3b8' : '#c96531', color: '#fff', fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer' }}
      >
        {isLoading ? 'Submitting...' : 'Join the waitlist'}
      </button>
    </form>
  )
}

type FieldProps = {
  label: string
  name: keyof FormData
  type: string
  value: string
  error?: string
  disabled: boolean
  onChange: (name: keyof FormData, value: string) => void
}

function Field({ label, name, type, value, error, disabled, onChange }: FieldProps) {
  return (
    <label style={{ display: 'grid', gap: '0.35rem' }}>
      <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{label}</span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(name, event.target.value)}
        style={{ minHeight: '3rem', borderRadius: '16px', border: '1px solid #e7ddd2', padding: '0 1rem', background: '#fffaf4' }}
      />
      {error ? <span style={{ color: '#b42318', fontSize: '0.8rem' }}>{error}</span> : null}
    </label>
  )
}

type TextareaFieldProps = {
  label: string
  name: keyof FormData
  value: string
  error?: string
  disabled: boolean
  onChange: (name: keyof FormData, value: string) => void
}

function TextareaField({ label, name, value, error, disabled, onChange }: TextareaFieldProps) {
  return (
    <label style={{ display: 'grid', gap: '0.35rem' }}>
      <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{label}</span>
      <textarea
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(name, event.target.value)}
        rows={4}
        style={{ borderRadius: '16px', border: '1px solid #e7ddd2', padding: '0.9rem 1rem', background: '#fffaf4', resize: 'vertical' }}
      />
      {error ? <span style={{ color: '#b42318', fontSize: '0.8rem' }}>{error}</span> : null}
    </label>
  )
}
