import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import localSEOConfig from '../data/seo-strategy.json'
import businessProfile from '../data/business-profile.json'
import { getSEODataForPage } from '../src/lib/seo-static'
import { getPublishedServiceArea, getPublishedServiceAreas, serviceAreas, type ServiceArea } from '../src/lib/service-areas'

const landingSource = readFileSync(new URL('../src/app/loa-quang-ngai/page.tsx', import.meta.url), 'utf8')
const sitemapSource = readFileSync(new URL('../src/app/sitemap.ts', import.meta.url), 'utf8')

test('local Quảng Ngãi landing has an indexable canonical SEO record', () => {
  const seo = getSEODataForPage('/loa-quang-ngai')
  assert.equal(seo?.canonicalUrl, 'https://tiendataudioquangngai.id.vn/loa-quang-ngai')
  assert.equal(seo?.metaRobots, 'index,follow')
  assert.ok(seo?.keywords.includes('loa Quảng Ngãi'))
})

test('local keyword map routes commercial queries to the landing or a matching guide', () => {
  const terms = new Map(localSEOConfig.keywords.map((keyword) => [keyword.term, keyword.targetPage]))
  assert.equal(terms.get('loa Quảng Ngãi'), '/loa-quang-ngai')
  assert.equal(terms.get('bán loa Quảng Ngãi'), '/loa-quang-ngai')
  assert.equal(terms.get('cửa hàng âm thanh Quảng Ngãi'), '/loa-quang-ngai')
  assert.equal(terms.get('lắp đặt âm thanh Quảng Ngãi'), '/kien-thuc/lap-dat-dan-karaoke-gia-dinh-quang-ngai')
  assert.equal(terms.get('tư vấn phối ghép âm thanh Quảng Ngãi'), '/loa-quang-ngai')
})

test('local landing is discoverable from sitemap and contains matching public facts', () => {
  assert.match(sitemapSource, /baseUrl}\/loa-quang-ngai/)
  assert.match(landingSource, /Loa Quảng Ngãi — Showroom/)
  assert.doesNotMatch(landingSource, /tel:\$\{phoneHref\}/)
  assert.match(landingSource, /264 Phan Đình Phùng/)
  assert.match(landingSource, /0934995657/)
  assert.match(landingSource, /FAQPage/)
  assert.match(landingSource, /application\/ld\+json/)
})

test('business profile fallback uses the post-merger address and lists neighbouring service areas', () => {
  assert.match(businessProfile.address.formatted, /Phường Cẩm Thành/)
  assert.equal(businessProfile.email, '')
  // Chỉ Facebook thật và Google Business Profile của cửa hàng (CID cố định), không trỏ tài khoản trùng tên.
  assert.deepEqual(businessProfile.socialLinks, ['https://www.facebook.com/amthanhtiendat', 'https://maps.google.com/?cid=1617460810128453419'])
  assert.equal(businessProfile.mapUrl, 'https://maps.google.com/?cid=1617460810128453419')
  assert.equal(businessProfile.address.postalCode, '53000')
  for (const area of ['Quảng Ngãi', 'Kon Tum', 'Quảng Nam', 'Đà Nẵng', 'Bình Định', 'Gia Lai']) {
    assert.ok(businessProfile.areaServed.includes(area), area)
  }
})

test('service area pages stay unpublished until they carry area-specific facts', () => {
  const complete: ServiceArea = {
    ...serviceAreas[0],
    summary: 'Giao và lắp đặt loa tại Kon Tum.',
    distance: 'Cách showroom khoảng 200 km',
    delivery: 'Giao bằng xe của cửa hàng.',
    installation: 'Kỹ thuật viên lên lắp đặt và cân chỉnh.',
    projects: ['Dàn karaoke gia đình 30m²'],
    faqs: [{ question: 'Q1', answer: 'A1' }, { question: 'Q2', answer: 'A2' }],
    published: true,
  }
  assert.equal(getPublishedServiceArea(complete.slug, [complete])?.slug, complete.slug)
  assert.equal(getPublishedServiceArea(complete.slug, [{ ...complete, published: false }]), null)
  assert.equal(getPublishedServiceArea(complete.slug, [{ ...complete, projects: [] }]), null)
  assert.equal(getPublishedServiceArea(complete.slug, [{ ...complete, delivery: ' ' }]), null)
  assert.deepEqual(getPublishedServiceAreas(), serviceAreas.filter((area) => getPublishedServiceArea(area.slug)))
  assert.match(sitemapSource, /getPublishedServiceAreas\(\)/)
})

test('navigation links only point at category ids that exist in the catalog', () => {
  const categoryIds = new Set(['loa-thung', 'loa-tram', 'vang-so', 'main-cong-suat', 'loa-bluetooth', 'amply-karaoke'])
  for (const file of ['../src/components/sonic/SonicHeader.tsx', '../src/components/sonic/SonicFooter.tsx', '../src/app/page.tsx', '../src/app/about/page.tsx', '../src/app/loa-quang-ngai/page.tsx']) {
    const source = readFileSync(new URL(file, import.meta.url), 'utf8')
    for (const [, id] of source.matchAll(/\/products\?category=([a-z0-9-]+)/g)) assert.ok(categoryIds.has(id), `${file}: ${id}`)
  }
  assert.match(sitemapSource, /brandIdsWithProducts/)
})
