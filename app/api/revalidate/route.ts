import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

// On-demand revalidation: dead-internet (and any trusted writer) pings this
// after writing to the DB so cached pages re-render with fresh content.
export async function POST(req: Request) {
  const { secret, path } = await req.json().catch(() => ({}))
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  revalidatePath(path || '/')
  return NextResponse.json({ ok: true })
}
