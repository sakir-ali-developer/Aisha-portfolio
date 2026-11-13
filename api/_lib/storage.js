/* File storage for uploads (hero photo, CV, project screenshots).
   Supports:
   1. AWS S3 / Compatible Object Storage Bucket (S3Client, presigned URLs, PutObjectCommand)
   2. Vercel Blob Storage
   3. Local file storage (uploads/ folder fallback)
*/

import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { put, del } from '@vercel/blob';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/* --------------------------------------------------------------------------
   1. AWS S3 / Compatible Object Storage Bucket
   -------------------------------------------------------------------------- */
const s3Bucket = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET || 'assets';
const s3Region = process.env.S3_REGION || process.env.AWS_REGION || 'us-east-2';

const s3ClientOptions = {
  region: s3Region,
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false'
};

if (process.env.S3_ENDPOINT || process.env.AWS_ENDPOINT_URL_S3) {
  s3ClientOptions.endpoint = process.env.S3_ENDPOINT || process.env.AWS_ENDPOINT_URL_S3;
}

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3ClientOptions.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    ...(process.env.AWS_SESSION_TOKEN ? { sessionToken: process.env.AWS_SESSION_TOKEN } : {})
  };
}

const s3Client = new S3Client(s3ClientOptions);

export { s3Client, s3Bucket };

const s3Storage = {
  async upload(name, buffer, contentType) {
    const key = `uploads/${Date.now()}-${name}`;

    try {
      await s3Client.send(new PutObjectCommand({
        Bucket: s3Bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType
      }));

      // If a custom public CDN or domain is specified
      if (process.env.S3_PUBLIC_URL) {
        const base = process.env.S3_PUBLIC_URL.replace(/\/+$/, '');
        return `${base}/${key}`;
      }

      // Generate signed URL (default 7 days = 604800 seconds)
      const expiresIn = Number(process.env.S3_SIGNED_URL_EXPIRES) || (7 * 24 * 3600);
      const url = await getSignedUrl(s3Client, new GetObjectCommand({
        Bucket: s3Bucket,
        Key: key
      }), { expiresIn });

      return url;
    } catch (err) {
      console.warn(`[S3Storage] Upload to bucket "${s3Bucket}" failed (${err.message}). Falling back to local storage.`);
      // Graceful fallback to local storage so uploads continue working
      return localStorage.upload(name, buffer, contentType);
    }
  },

  async remove(url) {
    if (!url) return;
    try {
      let key = null;
      if (url.startsWith('http://') || url.startsWith('https://')) {
        const parsed = new URL(url);
        let pathname = decodeURIComponent(parsed.pathname);
        if (pathname.startsWith(`/${s3Bucket}/`)) {
          pathname = pathname.substring(s3Bucket.length + 2);
        } else if (pathname.startsWith('/')) {
          pathname = pathname.substring(1);
        }
        key = pathname;
      } else if (url.startsWith('uploads/')) {
        key = url;
      }

      if (key) {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: s3Bucket,
          Key: key
        }));
      }
    } catch (err) {
      console.warn('[S3Storage] Delete failed:', err.message);
    }
  }
};

/* --------------------------------------------------------------------------
   2. Vercel Blob Storage Provider
   -------------------------------------------------------------------------- */
const vercelBlob = {
  async upload(name, buffer, contentType) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('BLOB_READ_WRITE_TOKEN is not set.');
    const blob = await put('uploads/' + name, buffer, {
      access: 'public',
      addRandomSuffix: true,
      contentType
    });
    return blob.url;
  },

  async remove(url) {
    if (!/\.blob\.vercel-storage\.com\//.test(url)) return;
    await del(url);
  }
};

/* --------------------------------------------------------------------------
   3. Local Disk Storage Provider (fallback)
   -------------------------------------------------------------------------- */
const localStorage = {
  async upload(name, buffer, contentType) {
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      await fs.mkdir(uploadsDir, { recursive: true });
      const uniqueName = Date.now() + '-' + name;
      await fs.writeFile(path.join(uploadsDir, uniqueName), buffer);
      return '/uploads/' + uniqueName;
    } catch {
      return `data:${contentType};base64,${buffer.toString('base64')}`;
    }
  },

  async remove(url) {
    if (url && url.startsWith('/uploads/')) {
      const filename = path.basename(url);
      try {
        await fs.unlink(path.join(process.cwd(), 'uploads', filename));
      } catch {}
    }
  }
};

/* --------------------------------------------------------------------------
   Storage Provider Selection:
   - 's3': if STORAGE_PROVIDER === 's3' or AWS credentials / bucket configured
   - 'blob': if BLOB_READ_WRITE_TOKEN is set
   - 'local': otherwise
   -------------------------------------------------------------------------- */
let activeStorage = localStorage;

if (
  process.env.STORAGE_PROVIDER === 's3' ||
  Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) ||
  Boolean(process.env.S3_BUCKET && process.env.STORAGE_PROVIDER !== 'blob' && process.env.STORAGE_PROVIDER !== 'local')
) {
  activeStorage = s3Storage;
} else if (process.env.BLOB_READ_WRITE_TOKEN) {
  activeStorage = vercelBlob;
} else if (process.env.PORTFOLIO_DEV_STORAGE) {
  const custom = await import(process.env.PORTFOLIO_DEV_STORAGE);
  activeStorage = custom.default || custom;
}

export default activeStorage;
