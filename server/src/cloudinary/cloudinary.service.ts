import { Injectable, BadRequestException } from '@nestjs/common';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

@Injectable()
export class CloudinaryService {
  private readonly uploadDir = join(process.cwd(), '..', 'client', 'public', 'uploads');

  constructor() {
    this.ensureUploadDir();
    console.log('🔧 Image upload service initialized - using local storage');
  }

  private async ensureUploadDir() {
    if (!existsSync(this.uploadDir)) {
      await mkdir(this.uploadDir, { recursive: true });
      console.log('📁 Created upload directory:', this.uploadDir);
    }
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'nutridash',
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    console.log('📤 Saving image locally:', { 
      size: file.size, 
      type: file.mimetype,
      filename: file.originalname 
    });

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const ext = file.originalname.split('.').pop() || 'jpg';
      const filename = `${timestamp}-${randomString}.${ext}`;
      
      // Save file to public/uploads
      const filepath = join(this.uploadDir, filename);
      await writeFile(filepath, file.buffer);
      
      // Return URL path (relative to Next.js public folder)
      const imageUrl = `/uploads/${filename}`;
      console.log('✅ Upload success:', imageUrl);
      
      return imageUrl;
    } catch (error: any) {
      console.error('❌ Image upload error:', error.message);
      throw new BadRequestException(`Image upload failed: ${error.message}`);
    }
  }
}
