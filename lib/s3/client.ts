import { S3Client } from '@aws-sdk/client-s3';

export function createS3Client(config: {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  region: string;
}): S3Client {
  // Validate required config
  if (!config.endpoint || !config.accessKey || !config.secretKey) {
    throw new Error('Missing required S3 configuration: endpoint, accessKey, or secretKey');
  }

  try {
    return new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      },
      forcePathStyle: true, // Required for Minio/RustFS compatibility
    });
  } catch (error) {
    throw new Error(`Failed to create S3 client: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

let s3ClientInstance: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!s3ClientInstance) {
    const endpoint = process.env.RUSTFS_ENDPOINT;
    const accessKey = process.env.RUSTFS_ACCESS_KEY;
    const secretKey = process.env.RUSTFS_SECRET_KEY;

    if (!endpoint || !accessKey || !secretKey) {
      throw new Error('Missing required environment variables: RUSTFS_ENDPOINT, RUSTFS_ACCESS_KEY, or RUSTFS_SECRET_KEY');
    }

    s3ClientInstance = createS3Client({
      endpoint,
      accessKey,
      secretKey,
      region: process.env.RUSTFS_REGION || 'us-east-1',
    });
  }
  return s3ClientInstance;
}
