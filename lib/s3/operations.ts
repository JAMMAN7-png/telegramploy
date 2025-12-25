import {
  ListBucketsCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  type S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';

export async function listAllBuckets(s3Client: S3Client) {
  try {
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);
    return response.Buckets || [];
  } catch (error) {
    throw new Error(`Failed to list buckets: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function listBucketObjects(s3Client: S3Client, bucketName: string) {
  if (!bucketName) {
    throw new Error('Bucket name is required');
  }

  try {
    const command = new ListObjectsV2Command({ Bucket: bucketName });
    const response = await s3Client.send(command);
    return response.Contents || [];
  } catch (error) {
    throw new Error(`Failed to list objects in bucket ${bucketName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function downloadFile(
  s3Client: S3Client,
  bucketName: string,
  objectKey: string,
  destinationPath: string
) {
  if (!bucketName || !objectKey || !destinationPath) {
    throw new Error('Bucket name, object key, and destination path are required');
  }

  console.log(`📥 Downloading: ${bucketName}/${objectKey}`);

  try {
    // Ensure directory exists
    const dir = dirname(destinationPath);
    await mkdir(dir, { recursive: true });

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      throw new Error('No response body received from S3');
    }

    const writeStream = createWriteStream(destinationPath);

    // Handle stream errors
    await new Promise<void>((resolve, reject) => {
      pipeline(response.Body as Readable, writeStream)
        .then(() => resolve())
        .catch((err) => reject(new Error(`Stream pipeline failed: ${err.message}`)));
    });

    console.log(`✅ Downloaded: ${destinationPath}`);
    return destinationPath;
  } catch (error) {
    throw new Error(`Failed to download ${bucketName}/${objectKey}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getPresignedUrl(
  s3Client: S3Client,
  bucketName: string,
  objectKey: string,
  expiresIn = 3600
) {
  if (!bucketName || !objectKey) {
    throw new Error('Bucket name and object key are required');
  }

  if (expiresIn < 1 || expiresIn > 604800) { // Max 7 days
    throw new Error('expiresIn must be between 1 and 604800 seconds (7 days)');
  }

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });
    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    throw new Error(`Failed to generate presigned URL for ${bucketName}/${objectKey}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
