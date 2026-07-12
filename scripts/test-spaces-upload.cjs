const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');

const client = new S3Client({
  region: 'fra1',
  endpoint: 'https://fra1.digitaloceanspaces.com',
  credentials: {
    accessKeyId: process.env.SPACES_ACCESS_KEY,
    secretAccessKey: process.env.SPACES_SECRET_KEY,
  },
  forcePathStyle: false,
});

async function main() {
  const key = 'listings/test/health-check.txt';
  await client.send(
    new PutObjectCommand({
      Bucket: 'lefrig',
      Key: key,
      Body: 'ok',
      ContentType: 'text/plain',
      ACL: 'public-read',
    }),
  );
  console.log('uploaded', key);
  console.log('direct-url', `https://lefrig.fra1.digitaloceanspaces.com/${key}`);
  console.log('cdn-url', `https://lefrig.fra1.cdn.digitaloceanspaces.com/${key}`);
}

main().catch((e) => {
  console.error('error', e.name, e.message);
  process.exit(1);
});
