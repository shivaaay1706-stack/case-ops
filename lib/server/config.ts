import { z } from 'zod';

const configSchema = z.object({
  DATABASE_URL: z.string().min(1),
  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  CASE_OPS_API_KEY: z.string().min(16),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(52_428_800),
  TESSERACT_COMMAND: z.string().default('tesseract'),
  PDFTOTEXT_COMMAND: z.string().default('pdftotext'),
  WHISPER_COMMAND: z.string().default('whisper'),
  WHISPER_MODEL: z.string().default('small'),
});

export function getServerConfig() {
  const parsed = configSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid server configuration: ${parsed.error.issues.map((issue) => issue.path.join('.')).join(', ')}`);
  }
  return parsed.data;
}
