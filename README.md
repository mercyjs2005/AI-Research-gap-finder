# AI Research Gap Finder

Next.js + TypeScript application for uploading a collection of research-paper PDFs and preparing them for future research-gap analysis. The project no longer uses a Python backend: the upload and health APIs are implemented as native Next.js Route Handlers.

## Stack

- Next.js 15 App Router
- TypeScript
- React 19
- Tailwind CSS 4
- Node.js filesystem storage for milestone-1 uploads

## Routes

- `/` — landing page and workflow overview
- `/analyze` — multi-PDF upload experience
- `POST /api/upload` — validates and stores PDFs under `uploads/project_<id>/`
- `GET /api/health` — health check returning `{ "status": "healthy" }`

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

| Variable | Default | Purpose |
|---|---:|---|
| `UPLOAD_DIR` | `uploads` | Directory used for stored project folders |
| `MAX_FILES` | `20` | Maximum PDFs per upload |
| `MAX_FILE_SIZE_MB` | `25` | Maximum size for each PDF |

## Validation

```bash
npm run typecheck
npm run build
```

The upload route checks filename type, duplicate names, file count, file size, and the `%PDF-` signature before storing files. It writes a `manifest.json` for each project and removes the project folder if any upload fails.

## Next milestone

Implement PDF text extraction in a server-side service called from the Next.js route layer, then expose project processing status to the analysis UI. The application remains intentionally honest: later AI stages are shown as locked until implemented.
