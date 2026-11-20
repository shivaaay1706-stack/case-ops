import { NextResponse } from 'next/server';
import { getDb } from '@/lib/server/db';
import { getServerConfig } from '@/lib/server/config';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const config = getServerConfig();
    await getDb().query('SELECT 1');
    return NextResponse.json({ status: 'ok', storage: config.S3_BUCKET, database: 'ok' });
  } catch (error) {
    console.error('Health check failed', error);
    return NextResponse.json({ status: 'error', message: 'Backend dependencies are unavailable.' }, { status: 503 });
  }
}
