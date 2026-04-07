import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

export interface UploadResult {
  url: string;
  key: string;
  bucket: string;
  size: number;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private config: ConfigService) {
    // Configure S3 client for Cloudflare R2
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: config.get('R2_ENDPOINT'),
      credentials: {
        accessKeyId: config.get('R2_ACCESS_KEY_ID'),
        secretAccessKey: config.get('R2_SECRET_ACCESS_KEY'),
      },
    });

    this.bucket = config.get('R2_BUCKET_NAME');
    this.publicUrl = config.get('R2_PUBLIC_URL');

    this.logger.log('Storage service initialized with Cloudflare R2');
  }

  /**
   * Upload a file to R2 storage
   * @param file - Buffer or stream of the file
   * @param folder - Optional folder path (e.g., 'images', 'audio', 'video')
   * @param fileName - Optional custom filename
   * @param contentType - MIME type of the file
   * @returns Upload result with URL and metadata
   */
  async uploadFile(
    file: Buffer,
    folder: string = 'uploads',
    fileName?: string,
    contentType?: string,
  ): Promise<UploadResult> {
    try {
      // Generate unique filename if not provided
      const fileExtension = fileName ? fileName.split('.').pop() : 'bin';
      const uniqueFileName = fileName || `${randomUUID()}.${fileExtension}`;
      const key = `${folder}/${uniqueFileName}`;

      // Upload to R2
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: contentType || this.detectContentType(fileExtension),
        CacheControl: 'public, max-age=31536000', // 1 year cache
      });

      await this.s3Client.send(command);

      // Construct public URL
      const url = `${this.publicUrl}/${key}`;

      this.logger.log(`File uploaded successfully: ${key}`);

      return {
        url,
        key,
        bucket: this.bucket,
        size: file.length,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`, error.stack);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  /**
   * Upload image with optimized settings
   */
  async uploadImage(
    imageBuffer: Buffer,
    characterId?: string,
    fileName?: string,
  ): Promise<UploadResult> {
    const folder = characterId ? `images/characters/${characterId}` : 'images';
    return this.uploadFile(imageBuffer, folder, fileName, 'image/png');
  }

  /**
   * Upload audio file (TTS output)
   */
  async uploadAudio(
    audioBuffer: Buffer,
    characterId?: string,
    fileName?: string,
  ): Promise<UploadResult> {
    const folder = characterId ? `audio/characters/${characterId}` : 'audio';
    return this.uploadFile(audioBuffer, folder, fileName, 'audio/mpeg');
  }

  /**
   * Upload video file
   */
  async uploadVideo(
    videoBuffer: Buffer,
    characterId?: string,
    fileName?: string,
  ): Promise<UploadResult> {
    const folder = characterId ? `video/characters/${characterId}` : 'video';
    return this.uploadFile(videoBuffer, folder, fileName, 'video/mp4');
  }

  /**
   * Delete a file from R2
   * @param key - The object key to delete
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`, error.stack);
      throw new Error(`File deletion failed: ${error.message}`);
    }
  }

  /**
   * Delete multiple files in batch
   */
  async deleteFiles(keys: string[]): Promise<void> {
    try {
      await Promise.all(keys.map((key) => this.deleteFile(key)));
      this.logger.log(`Deleted ${keys.length} files successfully`);
    } catch (error) {
      this.logger.error(`Batch deletion failed: ${error.message}`, error.stack);
      throw new Error(`Batch deletion failed: ${error.message}`);
    }
  }

  /**
   * Generate a presigned URL for temporary access
   * @param key - The object key
   * @param expiresIn - Expiration time in seconds (default: 1 hour)
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      return signedUrl;
    } catch (error) {
      this.logger.error(
        `Failed to generate signed URL: ${error.message}`,
        error.stack,
      );
      throw new Error(`Signed URL generation failed: ${error.message}`);
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(key: string): Promise<{
    size: number;
    contentType: string;
    lastModified: Date;
  }> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      return {
        size: response.ContentLength,
        contentType: response.ContentType,
        lastModified: response.LastModified,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get file metadata: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }

  /**
   * Extract key from full URL
   */
  extractKeyFromUrl(url: string): string {
    try {
      // Remove the public URL prefix to get the key
      return url.replace(`${this.publicUrl}/`, '');
    } catch (error) {
      this.logger.error(`Failed to extract key from URL: ${url}`, error.stack);
      throw new Error(`Invalid URL format: ${url}`);
    }
  }

  /**
   * Detect content type based on file extension
   */
  private detectContentType(extension: string): string {
    const contentTypes: Record<string, string> = {
      // Images
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      
      // Audio
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      m4a: 'audio/mp4',
      
      // Video
      mp4: 'video/mp4',
      webm: 'video/webm',
      avi: 'video/x-msvideo',
      mov: 'video/quicktime',
      
      // Documents
      pdf: 'application/pdf',
      json: 'application/json',
      txt: 'text/plain',
    };

    return contentTypes[extension.toLowerCase()] || 'application/octet-stream';
  }
}
