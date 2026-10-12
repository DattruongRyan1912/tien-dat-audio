import { NextResponse } from 'next/server'
import { requireAdmin, unauthorizedResponse } from '@/lib/admin-guard'
import { listAllContentPosts } from '@/lib/content-repository'
import { deriveContentSEOInsights } from '@/lib/content-seo'
import { getSEOConfig } from '@/lib/seo-strategy'

export async function GET() {
  if (!(await requireAdmin())) return unauthorizedResponse()
  try {
    const [config, posts] = await Promise.all([getSEOConfig(), listAllContentPosts()])
    return NextResponse.json({ success: true, data: deriveContentSEOInsights(config, posts) })
  } catch (error) {
    console.error('[admin/seo/insights]', error)
    return NextResponse.json({ success: false, message: 'Không thể phân tích content coverage' }, { status: 500 })
  }
}
