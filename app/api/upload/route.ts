import { NextResponse } from 'next/server'
import sharp from 'sharp'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { LIMITS } from '@/lib/limits'
import { checkRateLimit } from '@/lib/rate-limit'

// Force Node runtime — sharp is a native dep, won't run on Edge.
export const runtime = 'nodejs'

// Server-side upload — storage RLS denies all direct INSERTs from client.
// Caller posts a multipart/form-data with `file` and `kind` ∈ {media, whitepaper, avatar}.
//
// All images are processed through sharp before saving:
//   - reject if pixel dimensions exceed 8000×8000 (memory-bomb defence)
//   - strip EXIF / ICC / metadata (no GPS leaks)
//   - resize to fit within target dimensions (long edge)
//   - re-encode as WebP at quality 85 (smaller file, broad support)
//   - avatars are square-cropped to 256×256
//
// PDFs are passed through after magic-byte check.

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const PDF_TYPES = ['application/pdf']

const MAX_PIXEL_DIMENSION = 8000   // hard upper bound — reject before processing
const FEED_MAX_LONG_EDGE = 1600    // idea media long edge after resize
const AVATAR_SIZE = 256            // square output for avatars

export async function POST(request: Request) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }

  const allowed = await checkRateLimit(user.id, 'upload', 30)
  if (!allowed) return NextResponse.json({ error: 'Too many uploads' }, { status: 429 })

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = form.get('file')
  const kind = String(form.get('kind') ?? '')

  if (!(file instanceof File)) return NextResponse.json({ error: 'Missing file' }, { status: 400 })
  if (!['media', 'whitepaper', 'avatar'].includes(kind)) {
    return NextResponse.json({ error: 'Invalid kind' }, { status: 400 })
  }

  // Per-kind validation
  let allowedTypes: string[]
  let maxBytes: number
  let pathPrefix: string
  if (kind === 'media') {
    allowedTypes = IMAGE_TYPES
    maxBytes = LIMITS.imageMaxBytes
    pathPrefix = ''
  } else if (kind === 'whitepaper') {
    allowedTypes = PDF_TYPES
    maxBytes = LIMITS.pdfMaxBytes
    pathPrefix = 'wp-'
  } else {
    allowedTypes = IMAGE_TYPES
    maxBytes = LIMITS.avatarMaxBytes
    pathPrefix = `avatars/${user.id}-`
  }

  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
  }
  if (file.size > maxBytes) {
    return NextResponse.json({ error: `File too large (max ${Math.round(maxBytes / 1024 / 1024)}MB)` }, { status: 400 })
  }

  // Magic-byte check: read first bytes and verify the declared MIME matches.
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (!matchesMime(bytes, file.type)) {
    return NextResponse.json({ error: 'File contents do not match type' }, { status: 400 })
  }

  // ── Image processing path ────────────────────────────────────────────
  let storedBytes: Uint8Array | Buffer = bytes
  let storedExt = 'pdf'
  let storedMime = 'application/pdf'

  if (kind !== 'whitepaper') {
    try {
      const image = sharp(bytes, { failOn: 'error', limitInputPixels: MAX_PIXEL_DIMENSION * MAX_PIXEL_DIMENSION })
      const meta = await image.metadata()

      if (!meta.width || !meta.height) {
        return NextResponse.json({ error: 'Could not read image dimensions' }, { status: 400 })
      }
      if (meta.width > MAX_PIXEL_DIMENSION || meta.height > MAX_PIXEL_DIMENSION) {
        return NextResponse.json(
          { error: `Image dimensions too large (max ${MAX_PIXEL_DIMENSION}×${MAX_PIXEL_DIMENSION})` },
          { status: 400 }
        )
      }

      let pipeline = image.rotate() // honour EXIF orientation, then strip metadata below

      if (kind === 'avatar') {
        // Square-crop and resize to 256×256
        pipeline = pipeline.resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover', position: 'centre' })
      } else {
        // Idea media: fit within FEED_MAX_LONG_EDGE on long edge, no upscale
        pipeline = pipeline.resize(FEED_MAX_LONG_EDGE, FEED_MAX_LONG_EDGE, {
          fit: 'inside',
          withoutEnlargement: true,
        })
      }

      const out = await pipeline
        .webp({ quality: 85, effort: 4 })
        .toBuffer()

      storedBytes = out
      storedExt = 'webp'
      storedMime = 'image/webp'
    } catch (e) {
      console.error('sharp processing error:', e)
      return NextResponse.json({ error: 'Could not process image' }, { status: 400 })
    }
  }

  const random = Math.random().toString(36).slice(2, 10)
  const name = `${pathPrefix}${Date.now()}-${random}.${storedExt}`

  const admin = createAdminClient()
  const { error } = await admin.storage
    .from('idea-media')
    .upload(name, storedBytes, { contentType: storedMime, upsert: false })

  if (error) {
    console.error('upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  const { data } = admin.storage.from('idea-media').getPublicUrl(name)
  return NextResponse.json({ url: data.publicUrl })
}

// Magic-byte sniffing for the small set of types we accept.
function matchesMime(bytes: Uint8Array, mime: string): boolean {
  if (bytes.length < 4) return false
  // JPEG: FF D8 FF
  if (mime === 'image/jpeg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (mime === 'image/png') {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  }
  // WebP: RIFF????WEBP
  if (mime === 'image/webp') {
    return (
      bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
      && bytes.length > 11
      && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
    )
  }
  // PDF: %PDF
  if (mime === 'application/pdf') {
    return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46
  }
  return false
}
