/**
 * Idempotent: set public-read ACL on existing Spaces objects under listings/.
 * Safe for production — does not delete or rewrite object bodies.
 *
 * Usage (from apps/api, with STORAGE_* in env):
 *   pnpm db:fix-image-acl
 */
import {
  ListObjectsV2Command,
  PutObjectAclCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function loadEnvFile(filePath: string, override = false) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (override || !(key in process.env)) process.env[key] = value;
  }
}

// Prefer already-exported env (CI / shell). Fall back to monorepo .env files.
loadEnvFile(resolve(__dirname, '../../../.env'), false);
loadEnvFile(resolve(__dirname, '../../.env'), false);

async function main() {
  const endpoint = process.env.STORAGE_ENDPOINT ?? '';
  const bucket = process.env.STORAGE_BUCKET ?? '';
  const accessKey = process.env.STORAGE_ACCESS_KEY ?? '';
  const secretKey = process.env.STORAGE_SECRET_KEY ?? '';
  const region = process.env.STORAGE_REGION ?? 'fra1';
  const forcePathStyle = (process.env.STORAGE_FORCE_PATH_STYLE ?? 'false') === 'true';

  if (!endpoint || !bucket || !accessKey || !secretKey) {
    throw new Error('Missing STORAGE_* env (ENDPOINT, BUCKET, ACCESS_KEY, SECRET_KEY)');
  }

  if (endpoint.includes('localhost') || endpoint.includes('127.0.0.1')) {
    throw new Error(`Refusing local STORAGE_ENDPOINT (${endpoint}). Use production Spaces credentials.`);
  }

  console.log(`Endpoint host: ${new URL(endpoint).host}  bucket=${bucket}  pathStyle=${forcePathStyle}`);

  const client = new S3Client({
    endpoint,
    region,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    forcePathStyle,
  });

  const prefix = process.argv[2] ?? 'listings/';
  console.log(`Publishing objects under s3://${bucket}/${prefix} …`);

  let token: string | undefined;
  let count = 0;
  do {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: token,
      }),
    );
    for (const obj of page.Contents ?? []) {
      if (!obj.Key) continue;
      await client.send(
        new PutObjectAclCommand({
          Bucket: bucket,
          Key: obj.Key,
          ACL: 'public-read',
        }),
      );
      count += 1;
      console.log(`  ✓ ${obj.Key}`);
    }
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);

  console.log(`Done. ${count} objects set to public-read.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
