import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getServerConfig } from './config';

let client: S3Client | undefined;

function getStorage() {
  const config = getServerConfig();
  client ||= new S3Client({
    region: config.S3_REGION,
    endpoint: config.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.S3_ACCESS_KEY_ID,
      secretAccessKey: config.S3_SECRET_ACCESS_KEY,
    },
  });
  return { client, bucket: config.S3_BUCKET };
}

export async function putEvidence(objectKey: string, body: Buffer, contentType: string) {
  const { client: s3, bucket } = getStorage();
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: objectKey, Body: body, ContentType: contentType }));
}

export async function getEvidence(objectKey: string) {
  const { client: s3, bucket } = getStorage();
  return s3.send(new GetObjectCommand({ Bucket: bucket, Key: objectKey }));
}
