const { S3Client, CreateBucketCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');

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
  try {
    await client.send(new HeadBucketCommand({ Bucket: 'lefrig' }));
    console.log('bucket-exists');
  } catch (e) {
    const status = e.$metadata?.httpStatusCode;
    if (e.name === 'NotFound' || status === 404) {
      await client.send(new CreateBucketCommand({ Bucket: 'lefrig', ACL: 'public-read' }));
      console.log('bucket-created');
    } else {
      throw e;
    }
  }
}

main().catch((e) => {
  console.error('error', e.name, e.message);
  process.exit(1);
});
