import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/server/auth';
import { getDb } from '@/lib/server/db';
import { getEvidence } from '@/lib/server/storage';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const result = await getDb().query(
      'SELECT object_key AS "objectKey", content_type AS "contentType", file_name AS "fileName" FROM evidence_items WHERE id = $1',
      [id],
    );
    const record = result.rows[0];
    if (!record) return NextResponse.json({ error: 'Evidence not found.' }, { status: 404 });

    const object = await getEvidence(record.objectKey);
    if (!object.Body) return NextResponse.json({ error: 'Evidence object is empty.' }, { status: 404 });
    return new NextResponse(object.Body.transformToWebStream(), {
      headers: {
        'Content-Type': record.contentType,
        'Content-Disposition': `inline; filename="${record.fileName.replace(/["\r\n]/g, '')}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Evidence content retrieval failed', error);
    return NextResponse.json({ error: 'Evidence content retrieval failed.' }, { status: 500 });
  }
}
