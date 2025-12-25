import { createReadStream, createWriteStream, statSync, existsSync } from 'fs';
import { pipeline } from 'stream/promises';
import { basename, join } from 'path';
import { mkdir } from 'fs/promises';

const TELEGRAM_FILE_LIMIT = 50 * 1024 * 1024; // 50MB
const CHUNK_SIZE = 1.8 * 1024 * 1024 * 1024; // 1.8GB

export function shouldSplitFile(filePath: string): boolean {
  if (!filePath) {
    throw new Error('File path is required');
  }

  if (!existsSync(filePath)) {
    throw new Error(`File does not exist: ${filePath}`);
  }

  try {
    const stats = statSync(filePath);

    if (!stats.isFile()) {
      throw new Error(`Path is not a file: ${filePath}`);
    }

    return stats.size >= TELEGRAM_FILE_LIMIT;
  } catch (error) {
    throw new Error(`Failed to check file size: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function splitFile(
  filePath: string,
  outputDir: string
): Promise<Array<{ path: string; partNumber: number; size: number }>> {
  if (!filePath || !outputDir) {
    throw new Error('File path and output directory are required');
  }

  if (!existsSync(filePath)) {
    throw new Error(`Source file does not exist: ${filePath}`);
  }

  try {
    const stats = statSync(filePath);
    const totalSize = stats.size;
    const fileName = basename(filePath);

    if (totalSize === 0) {
      throw new Error('Cannot split an empty file');
    }

    console.log(`✂️ Splitting file: ${fileName} (${totalSize} bytes)`);

    // Ensure output directory exists
    await mkdir(outputDir, { recursive: true });

    const chunks: Array<{ path: string; partNumber: number; size: number }> = [];
    let partNumber = 1;
    let bytesRead = 0;

    while (bytesRead < totalSize) {
      const chunkPath = join(outputDir, `${fileName}.part${partNumber}`);
      const bytesToRead = Math.min(CHUNK_SIZE, totalSize - bytesRead);

      await createChunk(filePath, chunkPath, bytesRead, bytesToRead);

      chunks.push({
        path: chunkPath,
        partNumber,
        size: bytesToRead,
      });

      bytesRead += bytesToRead;
      partNumber++;
    }

    console.log(`✅ File split into ${chunks.length} chunks`);
    return chunks;
  } catch (error) {
    throw new Error(`Failed to split file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function createChunk(
  sourcePath: string,
  destPath: string,
  start: number,
  length: number
) {
  if (start < 0 || length <= 0) {
    throw new Error('Invalid chunk parameters: start must be >= 0 and length must be > 0');
  }

  try {
    const readStream = createReadStream(sourcePath, {
      start,
      end: start + length - 1,
    });
    const writeStream = createWriteStream(destPath);

    await pipeline(readStream, writeStream);
  } catch (error) {
    throw new Error(`Failed to create chunk at ${destPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
