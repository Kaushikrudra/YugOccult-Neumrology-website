import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import path from 'path'
import fs from 'fs'
import fsp from 'fs/promises'
import dotenv from 'dotenv'

dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
export const BUCKET_NAME = process.env.SUPABASE_MATERIALS_BUCKET || 'course-materials'

const LOCAL_UPLOADS_DIR = path.resolve(__dirname, '../../uploads')

export function getLocalUploadsPath(): string {
  return LOCAL_UPLOADS_DIR
}

export async function ensureUploadDirs(): Promise<void> {
  await fsp.mkdir(path.join(LOCAL_UPLOADS_DIR, 'site-assets'), { recursive: true })
  await fsp.mkdir(path.join(LOCAL_UPLOADS_DIR, 'courses'), { recursive: true })
  await fsp.mkdir(path.join(LOCAL_UPLOADS_DIR, 'ebooks'), { recursive: true })
  await fsp.mkdir(path.join(LOCAL_UPLOADS_DIR, 'reports'), { recursive: true })
}

export function getLocalFilePath(storagePath: string): string | null {
  const cleanSubPath = storagePath.startsWith('local:')
    ? storagePath.replace(/^local:/, '')
    : storagePath
  const fullPath = path.join(LOCAL_UPLOADS_DIR, cleanSubPath)
  if (fs.existsSync(fullPath)) {
    return fullPath
  }
  return null
}

let supabaseClient: SupabaseClient | null = null

export function isStorageConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && SUPABASE_URL.trim() !== '' && SUPABASE_SERVICE_ROLE_KEY.trim() !== '')
}

export function getSupabase(): SupabaseClient {
  if (!isStorageConfigured()) {
    throw new Error('Supabase Storage is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
  }
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    })
  }
  return supabaseClient
}

export async function uploadMaterialFile({
  courseId,
  buffer,
  mimeType,
  originalName,
}: {
  courseId: string
  buffer: Buffer
  mimeType: string
  originalName: string
}): Promise<{ storagePath: string; fileName: string; sizeBytes: number }> {
  // Clean and sanitize file name
  const ext = path.extname(originalName).toLowerCase()
  const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50)
  const uniqueId = randomUUID()
  const subPath = `courses/${courseId}/${uniqueId}_${baseName}${ext}`

  if (isStorageConfigured()) {
    const supabase = getSupabase()
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(subPath, buffer, {
        contentType: mimeType,
        upsert: false,
      })

    if (error) {
      console.error('[Storage:Upload] Failed to upload to Supabase:', error)
      throw new Error(`File upload failed: ${error.message}`)
    }

    return {
      storagePath: subPath,
      fileName: originalName,
      sizeBytes: buffer.length,
    }
  }

  // Local filesystem fallback
  await ensureUploadDirs()
  const localDir = path.join(LOCAL_UPLOADS_DIR, 'courses', courseId)
  await fsp.mkdir(localDir, { recursive: true })
  const localTarget = path.join(LOCAL_UPLOADS_DIR, subPath)
  await fsp.writeFile(localTarget, buffer)

  return {
    storagePath: `local:${subPath}`,
    fileName: originalName,
    sizeBytes: buffer.length,
  }
}

export async function deleteMaterialFile(storagePath: string): Promise<boolean> {
  if (!storagePath) return false

  if (storagePath.startsWith('local:')) {
    try {
      const cleanSubPath = storagePath.replace(/^local:/, '')
      const fullPath = path.join(LOCAL_UPLOADS_DIR, cleanSubPath)
      if (fs.existsSync(fullPath)) {
        await fsp.unlink(fullPath)
      }
      return true
    } catch (err) {
      console.error('[Storage:DeleteLocal] Error deleting file:', err)
      return false
    }
  }

  if (!isStorageConfigured()) return false

  try {
    const supabase = getSupabase()
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([storagePath])
    if (error) {
      console.error('[Storage:Delete] Warning: failed to delete file from Supabase:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('[Storage:Delete] Error deleting file:', err)
    return false
  }
}

export async function createSignedDownloadUrl(
  storagePath: string,
  expiresInSeconds: number = 60,
  options?: { download?: string | boolean }
): Promise<string> {
  if (!isStorageConfigured()) {
    throw new Error('Remote storage not configured')
  }
  const supabase = getSupabase()
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, expiresInSeconds, options)

  if (error || !data?.signedUrl) {
    console.error('[Storage:SignedUrl] Error creating signed URL:', error)
    throw new Error('Failed to generate secure temporary access URL')
  }

  return data.signedUrl
}

export async function uploadEbookFile({
  buffer,
  originalName,
}: {
  buffer: Buffer
  originalName: string
}): Promise<{ storagePath: string; fileName: string; sizeBytes: number }> {
  // Clean original file name safely (removes path traversal and strange control characters)
  const ext = path.extname(originalName).toLowerCase()
  const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_\-\.\s]/g, '_').trim().slice(0, 100)
  const safeFileName = `${baseName || 'ebook'}${ext}`

  const uniqueId = randomUUID()
  const subPath = `ebooks/${uniqueId}.pdf`

  if (isStorageConfigured()) {
    const supabase = getSupabase()
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(subPath, buffer, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (error) {
      console.error('[Storage:UploadEbook] Failed to upload to Supabase:', error)
      throw new Error(`Ebook upload failed: ${error.message}`)
    }

    return {
      storagePath: subPath,
      fileName: safeFileName,
      sizeBytes: buffer.length,
    }
  }

  // Local filesystem fallback
  await ensureUploadDirs()
  const localTarget = path.join(LOCAL_UPLOADS_DIR, subPath)
  await fsp.writeFile(localTarget, buffer)

  return {
    storagePath: `local:${subPath}`,
    fileName: safeFileName,
    sizeBytes: buffer.length,
  }
}

export async function uploadReportPdf({
  buffer,
  originalName,
}: {
  buffer: Buffer
  originalName: string
}): Promise<{ storagePath: string; fileName: string; sizeBytes: number }> {
  // Clean original file name safely
  const ext = path.extname(originalName).toLowerCase()
  const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_\-\.\s]/g, '_').trim().slice(0, 100)
  const safeFileName = `${baseName || 'report'}${ext}`

  const uniqueId = randomUUID()
  const subPath = `reports/${uniqueId}.pdf`

  if (isStorageConfigured()) {
    const supabase = getSupabase()
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(subPath, buffer, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (error) {
      console.error('[Storage:UploadReport] Failed to upload to Supabase:', error)
      throw new Error(`Report PDF upload failed: ${error.message}`)
    }

    return {
      storagePath: subPath,
      fileName: safeFileName,
      sizeBytes: buffer.length,
    }
  }

  // Local filesystem fallback
  await ensureUploadDirs()
  const localTarget = path.join(LOCAL_UPLOADS_DIR, subPath)
  await fsp.writeFile(localTarget, buffer)

  return {
    storagePath: `local:${subPath}`,
    fileName: safeFileName,
    sizeBytes: buffer.length,
  }
}

export async function uploadSiteImage({
  buffer,
  mimeType,
  originalName,
}: {
  buffer: Buffer
  mimeType: string
  originalName: string
}): Promise<string> {
  const ext = path.extname(originalName).toLowerCase()
  const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50)
  const uniqueId = randomUUID()
  const fileName = `${uniqueId}_${baseName}${ext}`

  if (isStorageConfigured()) {
    const supabase = getSupabase()
    const storagePath = `site-assets/${fileName}`

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: false,
      })

    if (error) {
      console.error('[Storage:UploadSiteImage] Failed to upload image to Supabase:', error)
      throw new Error(`Image upload failed: ${error.message}`)
    }

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath)
    return data.publicUrl
  }

  // Local filesystem fallback
  await ensureUploadDirs()
  const localTarget = path.join(LOCAL_UPLOADS_DIR, 'site-assets', fileName)
  await fsp.writeFile(localTarget, buffer)
  return `/uploads/site-assets/${fileName}`
}
