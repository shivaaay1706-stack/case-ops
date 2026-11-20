import { Pool } from 'pg';
import { getServerConfig } from './config';

declare global {
  // eslint-disable-next-line no-var
  var caseOpsPool: Pool | undefined;
}

export function getDb() {
  const config = getServerConfig();
  if (!global.caseOpsPool) {
    global.caseOpsPool = new Pool({ connectionString: config.DATABASE_URL, max: 10 });
  }
  return global.caseOpsPool;
}
