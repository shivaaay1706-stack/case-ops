import { NextRequest } from 'next/server';
import { getServerConfig } from './config';

export function isAuthorized(request: NextRequest) {
  const configuredKey = getServerConfig().CASE_OPS_API_KEY;
  const suppliedKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  return suppliedKey === configuredKey;
}
