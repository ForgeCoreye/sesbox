# sesbox

Voice-first creator SaaS for turning voice notes into publishable drafts.

## Overview

sesbox is a lightweight MVP designed to help creators capture ideas by voice and turn them into structured drafts they can review, approve, and export.

The product is intentionally simple:
- record a voice note
- transcribe it
- generate a draft
- approve or export the result

## Prerequisites

Before running the project locally, make sure you have:

- Node.js 18 or newer
- npm installed
- An OpenAI API key for transcription and draft generation

## Quick Start

1. Clone the repository

      git clone <repo-url>
   cd sesbox
   
2. Install dependencies

      npm install
   
3. Create your local environment file

      cp .env.example .env
   
4. Add your API key to `.env`

   - Set `OPENAI_API_KEY` to your OpenAI API key

5. Start the development server

      npm run dev
   
6. Open the app in your browser

   - Use the local development URL printed in the terminal

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `NODE_ENV` | Yes | Runtime environment, such as `development` or `production` |
| `NEXT_PUBLIC_APP_NAME` | Yes | Public app name shown in the UI |
| `OPENAI_API_KEY` | Yes | API key used by the local adapter for transcription and draft generation |

## Architecture

sesbox uses a simple voice-to-draft pipeline:

1. Voice record  
   The user records a voice note in the app.

2. Whisper transcription  
   The audio is sent through a local adapter under `lib/` that handles the external transcription provider call. This keeps route and UI layers thin.

3. Draft generation  
   The transcript is converted into a structured draft using centralized provider logic under `lib/`.

4. Review and approve  
   The user reviews the generated draft, makes edits if needed, and approves it.

5. Export  
   The final draft can be exported for publishing or downstream use.

### Design Principles

- Keep third-party SDK usage inside local adapter modules under `lib/`
- Avoid direct SDK imports in route handlers or UI components
- Centralize provider calls so the app remains easy to test and maintain
- Keep the core user flow stable while adding new capabilities incrementally

## Project Notes

This project is focused on shipping a waitlist-ready MVP with a clean setup experience and a minimal, reliable content pipeline.

## Getting Help

If setup fails:

- confirm Node.js 18+ is installed
- verify `.env` exists and contains `OPENAI_API_KEY`
- restart the dev server after changing environment variables
- check terminal logs for runtime errors and missing configuration