import assert from 'node:assert/strict'
import { test } from 'node:test'
import fallbackProfile from '../data/business-profile.json'
import { buildAIReadableStructuredData, buildLLMSText, normalizeSEOConfig } from '../src/lib/seo-strategy'
import type { BusinessProfile } from '../src/lib/business-profile'

test('llms.txt exposes Markdown links for canonical and discovery pages', () => {
  const config = normalizeSEOConfig({
    keywords: [{ id: 'local-audio', term: 'thiết bị âm thanh Quảng Ngãi', targetPage: '/products', intent: 'local', cluster: 'core-local' }],
    ai: {
      enabled: true,
      positioning: 'Tư vấn âm thanh theo không gian.',
      entityFacts: [],
      services: [],
      faqs: [],
      preferredSources: ['/', '/products'],
      answerGuidelines: [],
    },
  })
  const output = buildLLMSText(config, fallbackProfile as BusinessProfile)

  assert.match(output, /^# Tiến Đạt Audio\n/)
  assert.match(output, /^> .+\n/m)
  assert.match(output, /- Website: \[Tiến Đạt Audio\]\(https:\/\/tiendataudioquangngai\.id\.vn\)/)
  assert.match(output, /- \[thiết bị âm thanh Quảng Ngãi\]\(https:\/\/tiendataudioquangngai\.id\.vn\/products\)/)
  assert.match(output, /- \[Homepage\]\(https:\/\/tiendataudioquangngai\.id\.vn\/?\)/)
})

test('WebSite schema prefers the brand name and keeps the localized name as the only alternate', () => {
  const data = buildAIReadableStructuredData(normalizeSEOConfig({}), fallbackProfile as BusinessProfile)
  const website = data['@graph'].find((node) => node['@type'] === 'WebSite') as Record<string, unknown>
  // Tên ưu tiên khớp tên Google Business Profile; tên có địa danh làm dự phòng nếu Google không dùng được tên ngắn.
  assert.equal(website.name, 'Tiến Đạt Audio')
  // Không khai domain làm tên dự phòng: Google sẽ chọn domain khi chưa tin tên chính.
  assert.deepEqual(website.alternateName, ['Tiến Đạt Audio Quảng Ngãi'])
})

test('LocalBusiness schema exposes the founding year from the business profile', () => {
  const data = buildAIReadableStructuredData(normalizeSEOConfig({}), { ...(fallbackProfile as BusinessProfile), foundingDate: '2005' })
  const business = data['@graph'].find((node) => Array.isArray(node['@type']) && (node['@type'] as string[]).includes('LocalBusiness')) as Record<string, unknown>
  assert.equal(business.foundingDate, '2005')
})

test('knowsAbout keeps high-priority keywords when there are more than 50 topics', () => {
  const keywords = [
    ...Array.from({ length: 60 }, (_, index) => ({ id: `kw-medium-${index}`, term: `chủ đề phụ ${index}`, priority: 'medium' })),
    { id: 'kw-high-howto', term: 'cách chỉnh vang số', priority: 'high', intent: 'informational' },
    { id: 'kw-high', term: 'đại lý ARF Quảng Ngãi', priority: 'high', intent: 'local' },
  ]
  const data = buildAIReadableStructuredData(normalizeSEOConfig({ keywords }), fallbackProfile as BusinessProfile)
  const business = data['@graph'][0] as { knowsAbout: string[] }
  assert.equal(business.knowsAbout.length, 50)
  assert.deepEqual(business.knowsAbout.slice(0, 2), ['đại lý ARF Quảng Ngãi', 'cách chỉnh vang số'])
})
