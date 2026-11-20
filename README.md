# CASE-OPS

CASE-OPS is a source-attributed evidence ingestion and chronology workspace.

## Backend setup

1. Copy `.env.example` to `.env.local` and replace `CASE_OPS_API_KEY` with a random value of at least 16 characters.
2. Start PostgreSQL and S3-compatible storage:

   ```powershell
   docker compose up -d
   ```

3. Install the native processing tools on the machine running Next.js:
   - `tesseract` for scanned images
   - `pdftotext` (Poppler) for text PDFs
   - Python, FFmpeg, and `whisper`/`faster-whisper` for audio
4. Start the application:

   ```powershell
   npm run dev
   ```

## API

All backend endpoints require `x-api-key` or `Authorization: Bearer <key>`.

- `GET /api/health` checks configuration and PostgreSQL connectivity.
- `POST /api/evidence` accepts multipart form data with `caseId` and `file`.
- `GET /api/evidence?caseId=<id>` lists durable evidence records and processing status.

The upload endpoint stores the original object before processing. Processing failures are persisted as `failed` records with an explicit error; no placeholder transcript or OCR text is generated.
