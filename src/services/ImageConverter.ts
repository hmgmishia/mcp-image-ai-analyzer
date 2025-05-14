import fs from 'fs/promises';
import path from 'path';
import https from 'https';

export class ImageConverter {
  async fromPath(imagePath: string): Promise<string> {
    try {
      const buffer = await fs.readFile(imagePath);
      return buffer.toString('base64');
    } catch (error) {
      throw new Error(`Failed to read image from path: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async fromUrl(imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      https.get(imageUrl, (response) => {
        const chunks: Buffer[] = [];
        
        response.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve(buffer.toString('base64'));
        });

        response.on('error', (error) => {
          reject(new Error(`Failed to download image: ${error.message}`));
        });
      }).on('error', (error) => {
        reject(new Error(`Failed to fetch image: ${error.message}`));
      });
    });
  }
} 