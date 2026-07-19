import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { env } from '../config/env.js'
import { logger } from './logger.js'
import { v4 as uuid } from 'uuid'

const s3 = env.S3_ENDPOINT
  ? new S3Client({
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY || '',
        secretAccessKey: env.S3_SECRET_KEY || '',
      },
    })
  : null

export async function uploadFile(buffer: Buffer, originalName: string, contentType: string): Promise<string> {
  if (!s3 || !env.S3_BUCKET) {
    throw new Error('S3 not configured')
  }
  const ext = originalName.split('.').pop()
  const key = `uploads/${uuid()}.${ext}`

  await s3.send(new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }))

  return `${env.S3_ENDPOINT}/${env.S3_BUCKET}/${key}`
}

export async function deleteFile(key: string) {
  if (!s3 || !env.S3_BUCKET) return
  await s3.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }))
}
