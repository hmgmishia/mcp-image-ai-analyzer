import fs from 'fs/promises';
import path from 'path';
import https from 'https';

export class ImageConverter {
  private readonly ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  private async validateImage(buffer: Buffer): Promise<void> {
    // ファイルサイズの検証
    if (buffer.length > this.MAX_FILE_SIZE) {
      throw new Error(`Image size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    // 画像形式の検証（簡易的な方法）
    const signature = buffer.toString('hex', 0, 4);
    if (!(
      signature.startsWith('ffd8') || // JPEG
      signature.startsWith('89504e47') || // PNG
      signature.startsWith('47494638') || // GIF
      signature.startsWith('52494646') // WEBP
    )) {
      throw new Error('Invalid image format. Supported formats are: JPEG, PNG, GIF, WEBP');
    }
  }

  async fromPath(imagePath: string): Promise<string> {
    try {
      // パスの正規化と検証
      const normalizedPath = path.normalize(imagePath);
      if (normalizedPath.includes('..')) {
        throw new Error('Path traversal is not allowed');
      }

      const buffer = await fs.readFile(normalizedPath);
      await this.validateImage(buffer);
      return buffer.toString('base64');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to process image from path: ${error.message}`);
      }
      throw new Error('Unknown error occurred while processing image from path');
    }
  }

  async fromUrl(imageUrl: string): Promise<string> {
    try {
      // URLの検証
      const url = new URL(imageUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Only HTTP and HTTPS protocols are supported');
      }

      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        let totalSize = 0;
        
        https.get(url, (response) => {
          // Content-Typeの検証
          const contentType = response.headers['content-type'];
          if (!contentType || !this.ALLOWED_MIME_TYPES.includes(contentType)) {
            reject(new Error(`Unsupported content type: ${contentType}`));
            return;
          }

          response.on('data', (chunk: Buffer) => {
            totalSize += chunk.length;
            if (totalSize > this.MAX_FILE_SIZE) {
              response.destroy();
              reject(new Error(`Image size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`));
              return;
            }
            chunks.push(chunk);
          });

          response.on('end', async () => {
            const buffer = Buffer.concat(chunks);
            try {
              await this.validateImage(buffer);
              resolve(buffer.toString('base64'));
            } catch (error) {
              reject(error);
            }
          });

          response.on('error', (error) => {
            reject(new Error(`Failed to download image: ${error.message}`));
          });
        }).on('error', (error) => {
          reject(new Error(`Failed to fetch image: ${error.message}`));
        });
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to process image from URL: ${error.message}`);
      }
      throw new Error('Unknown error occurred while processing image from URL');
    }
  }
} 