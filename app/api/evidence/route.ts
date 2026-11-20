import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/server/auth';
import { getServerConfig } from '@/lib/server/config';
import { getDb } from '@/lib/server/db';
import { extractEvidenceText, ProcessableEvidence } from '@/lib/server/processor';
import { putEvidence } from '@/lib/server/storage';

export const runtime = 'nodejs';

const supportedTypes: Record<string, ProcessableEvidence> = {
  'application/pdf': 'pdf',
  'image/png': 'scanned_image',
  'image/jpeg': 'scanned_image',
  'image/tiff': 'scanned_image',
  'text/plain': 'whatsapp',
  'audio/mpeg': 'audio',
  'audio/wav': 'audio',
  'audio/x-wav': 'audio',
  'audio/mp4': 'audio',
  'audio/ogg': 'audio',
};

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) return unauthorized();
    const config = getServerConfig();
    const form = await request.formData();
    const file = form.get('file');
    const caseId = form.get('caseId');
    if (!(file instanceof File) || typeof caseId !== 'string' || !caseId.trim()) {
      return NextResponse.json({ error: 'file and caseId are required.' }, { status: 400 });
    }
    if (file.size === 0 || file.size > config.MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: `File must be between 1 byte and ${config.MAX_UPLOAD_BYTES} bytes.` }, { status: 413 });
    }
    const type = supportedTypes[file.type] || (file.name.toLowerCase().endsWith('.txt') ? 'whatsapp' : undefined);
    if (!type) return NextResponse.json({ error: `Unsupported evidence type: ${file.type || file.name}` }, { status: 415 });

    const id = randomUUID();
    const objectKey = `${caseId.trim()}/${id}/${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await putEvidence(objectKey, buffer, file.type || 'application/octet-stream');
    const db = getDb();
    await db.query(
      `INSERT INTO evidence_items (id, case_id, type, file_name, content_type, object_key, processing_status)
       VALUES ($1, $2, $3, $4, $5, $6, 'processing')`,
      [id, caseId.trim(), type, file.name, file.type || 'application/octet-stream', objectKey],
    );

    try {
      const rawText = await extractEvidenceText(type, file.name, buffer);
      await db.query(
        `UPDATE evidence_items SET raw_text = $1, processing_status = 'completed', updated_at = now() WHERE id = $2`,
        [rawText, id],
      );
      return NextResponse.json({ id, caseId: caseId.trim(), type, fileName: file.name, processingStatus: 'completed' }, { status: 201 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Evidence processing failed.';
      await db.query(
        `UPDATE evidence_items SET processing_status = 'failed', processing_error = $1, updated_at = now() WHERE id = $2`,
        [message, id],
      );
      console.error('Evidence processing failed', { id, error });
      return NextResponse.json({ id, processingStatus: 'failed', error: message }, { status: 422 });
    }
  } catch (error) {
    console.error('Evidence upload failed', error);
    return NextResponse.json({ error: 'Evidence upload failed.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) return unauthorized();
    const caseId = new URL(request.url).searchParams.get('caseId');
    if (!caseId) return NextResponse.json({ error: 'caseId is required.' }, { status: 400 });
    const result = await getDb().query(
      `SELECT id, case_id AS "caseId", type, file_name AS "fileName", content_type AS "contentType",
              raw_text AS "rawText", metadata, processing_status AS "processingStatus",
              processing_error AS "processingError", created_at AS "createdAt"
       FROM evidence_items WHERE case_id = $1 ORDER BY created_at DESC`,
      [caseId],
    );
    return NextResponse.json({ items: result.rows });
  } catch (error) {
    console.error('Evidence listing failed', error);
    return NextResponse.json({ error: 'Evidence listing failed.' }, { status: 500 });
  }
}
