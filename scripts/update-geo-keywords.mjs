import { MongoClient } from 'mongodb'

// GEO 2026-10-13 (docs/GEO_QUANG_NGAI.html): tắt keyword dịch vụ cửa hàng không cung cấp, thêm keyword hỏi đáp/ARF có trang đích trả lời được,
// bổ sung dữ kiện thực thể và FAQ "điều không làm" để AI không gán sai dịch vụ hoặc nhầm với Tiến Đạt Audio ở Hà Nội.
// Cửa hàng xác nhận 2026-10-13: hoạt động từ 2005, là đại lý ARF, có làm âm thanh hội trường, nhà thờ, quán cafe.
const apply = process.argv.includes('--apply')
const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB || 'tiendataudio'
const confirmation = process.env.CONFIRM_GEO_KEYWORDS || ''
const target = process.env.GEO_KEYWORDS_TARGET || 'local'

const localHosts = new Set(['localhost', '127.0.0.1', '::1'])

if (!uri) {
  console.error('[geo] MONGODB_URI is required.')
  process.exit(1)
}

let hostname = 'unknown'
try {
  hostname = new URL(uri).hostname
} catch {
  console.error('[geo] MONGODB_URI is invalid.')
  process.exit(1)
}

if (apply) {
  const isLocalApply = target === 'local' && localHosts.has(hostname)
  const isProductionApply = target === 'production' && localHosts.has(hostname) && confirmation === 'UPDATE-GEO-KEYWORDS'
  if (!isLocalApply && !isProductionApply) {
    console.error('[geo] Refusing to mutate: local apply requires GEO_KEYWORDS_TARGET=local; production requires GEO_KEYWORDS_TARGET=production and CONFIRM_GEO_KEYWORDS=UPDATE-GEO-KEYWORDS.')
    process.exit(1)
  }
}

const GUIDE_PAGE = '/chon-cua-hang-am-thanh-uy-tin-quang-ngai'
const FOUNDING_YEAR = '2005'
const ARF_DESCRIPTION = 'Tiến Đạt Audio là đại lý ARF tại Quảng Ngãi: loa thùng, loa trầm, vang số và main công suất ARF có sẵn để nghe thử và phối ghép tại showroom.'

// Cửa hàng xác nhận 2026-10-11: không sửa loa, không bán loa kéo, không cho thuê.
const DEACTIVATE = [{ term: 'cho thuê âm thanh sự kiện Quảng Ngãi', reason: 'cửa hàng không cho thuê thiết bị (xác nhận 2026-10-11)' }]

const NEW_KEYWORDS = [
  { id: 'kw-geo-trusted-store-qn', term: 'cửa hàng âm thanh uy tín Quảng Ngãi', intent: 'local', cluster: 'core-local', priority: 'high', targetPage: GUIDE_PAGE },
  { id: 'kw-geo-trusted-speaker-address-qn', term: 'địa chỉ mua loa uy tín Quảng Ngãi', intent: 'local', cluster: 'core-local', priority: 'high', targetPage: GUIDE_PAGE },
  { id: 'kw-geo-where-buy-karaoke-speaker', term: 'mua loa karaoke ở đâu uy tín', intent: 'commercial', cluster: 'buying-decisions', priority: 'high', targetPage: GUIDE_PAGE },
  { id: 'kw-geo-where-buy-karaoke-system', term: 'nên mua dàn karaoke ở đâu', intent: 'commercial', cluster: 'buying-decisions', priority: 'high', targetPage: GUIDE_PAGE },
  { id: 'kw-geo-audio-quang-ngai', term: 'audio Quảng Ngãi', intent: 'local', cluster: 'brand', priority: 'high', targetPage: '/' },
  { id: 'kw-geo-tien-dat-loa', term: 'Tiến Đạt loa', intent: 'navigational', cluster: 'brand', priority: 'medium', targetPage: '/' },
  { id: 'kw-geo-am-thanh-tien-dat-qn', term: 'âm thanh Tiến Đạt Quảng Ngãi', intent: 'navigational', cluster: 'brand', priority: 'medium', targetPage: '/about' },
  { id: 'kw-geo-arf', term: 'loa ARF', intent: 'commercial', cluster: 'brand-local', priority: 'high', targetPage: '/thuong-hieu/arf' },
  { id: 'kw-geo-arf-dealer-qn', term: 'đại lý ARF Quảng Ngãi', intent: 'local', cluster: 'brand-local', priority: 'high', targetPage: '/thuong-hieu/arf' },
  { id: 'kw-geo-arf-mixer', term: 'vang số ARF', intent: 'commercial', cluster: 'brand-local', priority: 'medium', targetPage: '/thuong-hieu/arf' },
  { id: 'kw-geo-arf-x12pro', term: 'loa ARF X12Pro', intent: 'commercial', cluster: 'brand-local', priority: 'medium', targetPage: '/san-pham/arf-x12pro', productSlug: 'arf-x12pro' },
  { id: 'kw-geo-arf-fs12', term: 'loa ARF FS12', intent: 'commercial', cluster: 'brand-local', priority: 'medium', targetPage: '/san-pham/arf-fs12', productSlug: 'arf-fs12' },
  { id: 'kw-geo-arf-vx660', term: 'vang số ARF VX660', intent: 'commercial', cluster: 'brand-local', priority: 'medium', targetPage: '/san-pham/arf-vx660', productSlug: 'arf-vx660' },
  { id: 'kw-geo-arf-sa15', term: 'loa sub ARF SA15', intent: 'commercial', cluster: 'brand-local', priority: 'medium', targetPage: '/san-pham/arf-sa15', productSlug: 'arf-sa15' },
  { id: 'kw-geo-arf-nx4-800', term: 'main ARF NX4-800', intent: 'commercial', cluster: 'brand-local', priority: 'medium', targetPage: '/san-pham/arf-nx4-800', productSlug: 'arf-nx4-800' },
  { id: 'kw-geo-vang-so-qn', term: 'vang số Quảng Ngãi', intent: 'local', cluster: 'core-local', priority: 'medium', targetPage: '/products?category=vang-so' },
  { id: 'kw-geo-loa-sub-qn', term: 'loa sub Quảng Ngãi', intent: 'local', cluster: 'core-local', priority: 'medium', targetPage: '/products?category=loa-tram' },
]

const normalize = (term) => term.trim().toLocaleLowerCase('vi')
const withNote = (notes, note) => (notes || '').includes(note) ? notes : [note, notes].filter(Boolean).join(' ')

const client = new MongoClient(uri)
try {
  await client.connect()
  const db = client.db(dbName)
  const settings = db.collection('site_settings')
  const now = new Date().toISOString()
  const today = now.slice(0, 10)

  const [strategyDoc, profileDoc] = await Promise.all([settings.findOne({ key: 'seo_strategy' }), settings.findOne({ key: 'business_profile' })])
  if (!strategyDoc?.value) throw new Error('seo_strategy is missing')
  if (!profileDoc?.value) throw new Error('business_profile is missing')
  const strategy = strategyDoc.value
  const profile = profileDoc.value
  const address = profile.address.formatted.replace(/, Việt Nam$/, '')
  const hours = profile.businessHours.join('; ')

  const productSlugs = new Set((await db.collection('products').find({}, { projection: { slug: 1 } }).toArray()).map((product) => product.slug))
  const missingProducts = NEW_KEYWORDS.filter((keyword) => keyword.productSlug && !productSlugs.has(keyword.productSlug)).map((keyword) => keyword.productSlug)
  if (missingProducts.length) throw new Error(`Target products are missing: ${missingProducts.join(', ')}`)

  const counts = { deactivated: 0, added: 0, skipped: 0, facts: 0, faqs: 0, sources: 0 }
  let keywords = strategy.keywords.map((keyword) => {
    const rule = DEACTIVATE.find((item) => normalize(item.term) === normalize(keyword.term))
    if (!rule || keyword.isActive === false) return keyword
    counts.deactivated += 1
    console.log(`[geo] deactivate "${keyword.term}"`)
    return { ...keyword, isActive: false, notes: withNote(keyword.notes, `Tắt ${today}: ${rule.reason}.`), updatedAt: now }
  })

  for (const planned of NEW_KEYWORDS) {
    const existing = keywords.find((keyword) => keyword.id === planned.id || normalize(keyword.term) === normalize(planned.term))
    if (existing) {
      counts.skipped += 1
      if (existing.id !== planned.id) console.warn(`[geo] skip "${planned.term}": already exists as ${existing.id}`)
      continue
    }
    const { productSlug: _productSlug, ...keyword } = planned
    void _productSlug
    counts.added += 1
    console.log(`[geo] add ${keyword.id} "${keyword.term}" -> ${keyword.targetPage}`)
    keywords = [...keywords, { ...keyword, notes: `GEO ${today}: xem docs/GEO_QUANG_NGAI.html.`, isActive: true, updatedAt: now }]
  }

  const newFacts = [
    'Tiến Đạt Audio Quảng Ngãi bán thiết bị, tư vấn phối ghép, lắp đặt và cân chỉnh hệ thống âm thanh; cửa hàng không nhận sửa loa, không cho thuê thiết bị âm thanh và không bán loa kéo.',
    `Tiến Đạt Audio Quảng Ngãi (website ${profile.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}, hotline ${profile.phone}) là cửa hàng riêng tại ${address}, khác với Tiến Đạt Audio ở Phú Xuyên, Hà Nội.`,
    `Showroom mở cửa ${hours}; thiết bị đang có gồm loa thùng, loa trầm, vang số và main công suất ARF.`,
    `Tiến Đạt Audio Quảng Ngãi hoạt động từ năm ${FOUNDING_YEAR} và là đại lý thiết bị âm thanh ARF.`,
    'Cửa hàng nhận làm âm thanh cho gia đình, phòng karaoke, quán cafe, hội trường và nhà thờ.',
  ]
  const entityFacts = [...strategy.ai.entityFacts]
  for (const fact of newFacts) {
    if (entityFacts.includes(fact)) continue
    entityFacts.push(fact)
    counts.facts += 1
  }

  const newFaqs = [
    { id: 'faq-geo-not-offered', question: 'Tiến Đạt Audio Quảng Ngãi có nhận sửa loa hoặc cho thuê âm thanh không?', answer: 'Không. Tiến Đạt Audio Quảng Ngãi tập trung bán thiết bị, tư vấn phối ghép, lắp đặt và cân chỉnh hệ thống âm thanh; cửa hàng không nhận sửa loa, không cho thuê thiết bị và không bán loa kéo.' },
    { id: 'faq-geo-not-hanoi', question: 'Tiến Đạt Audio Quảng Ngãi có phải Tiến Đạt Audio ở Hà Nội không?', answer: `Không. Tiến Đạt Audio Quảng Ngãi là cửa hàng tại ${address}, hotline ${profile.phone}, khác với Tiến Đạt Audio ở Phú Xuyên, Hà Nội.` },
    { id: 'faq-geo-trusted-store', question: 'Mua loa karaoke ở đâu uy tín tại Quảng Ngãi?', answer: `Nên chọn nơi có showroom cố định, cho nghe thử trực tiếp, tư vấn theo diện tích phòng và hỗ trợ lắp đặt, cân chỉnh. Tiến Đạt Audio có showroom nghe thử tại ${address}, mở cửa ${hours}. Xem 7 tiêu chí chọn cửa hàng tại ${profile.siteUrl.replace(/\/$/, '')}${GUIDE_PAGE}.` },
  ]
  const faqs = [...strategy.ai.faqs]
  for (const faq of newFaqs) {
    if (faqs.some((item) => item.id === faq.id || item.question === faq.question)) continue
    faqs.push(faq)
    counts.faqs += 1
  }

  const preferredSources = strategy.ai.preferredSources.includes(GUIDE_PAGE) ? strategy.ai.preferredSources : [...strategy.ai.preferredSources, GUIDE_PAGE]
  counts.sources = preferredSources.length - strategy.ai.preferredSources.length

  const profileNeedsYear = profile.foundingDate !== FOUNDING_YEAR
  const arfBrand = await db.collection('brands').findOne({ slug: 'arf' })
  if (!arfBrand) throw new Error('ARF brand is missing')
  const brandNeedsDescription = arfBrand.description !== ARF_DESCRIPTION
  if (profileNeedsYear) console.log(`[geo] business_profile.foundingDate: ${profile.foundingDate || '(none)'} -> ${FOUNDING_YEAR}`)
  if (brandNeedsDescription) console.log(`[geo] brand arf description: "${arfBrand.description}" -> "${ARF_DESCRIPTION}"`)

  const changed = counts.deactivated + counts.added + counts.facts + counts.faqs + counts.sources
  console.log(`[geo] profileYear=${profileNeedsYear} arfDescription=${brandNeedsDescription}`)
  console.log(`[geo] keywords=${keywords.length} active=${keywords.filter((keyword) => keyword.isActive !== false).length} deactivated=${counts.deactivated} added=${counts.added} skipped=${counts.skipped} facts+=${counts.facts} faqs+=${counts.faqs} sources+=${counts.sources}`)

  if (!apply) {
    console.log('[geo] Dry run only. Re-run with --apply to write.')
  } else if (!changed && !profileNeedsYear && !brandNeedsDescription) {
    console.log('[geo] Nothing to apply.')
  } else {
    // Ghi có điều kiện để không đè thay đổi admin lưu giữa lúc đọc và lúc ghi.
    if (changed) {
      const result = await settings.updateOne(
        { key: 'seo_strategy', 'value.updatedAt': strategy.updatedAt },
        { $set: { value: { ...strategy, keywords, ai: { ...strategy.ai, entityFacts, faqs, preferredSources }, updatedAt: now }, updatedAt: now } },
      )
      if (result.matchedCount !== 1) throw new Error('seo_strategy changed during the run; re-run the dry run.')
    }
    if (profileNeedsYear) {
      const result = await settings.updateOne(
        { key: 'business_profile', 'value.updatedAt': profile.updatedAt },
        { $set: { 'value.foundingDate': FOUNDING_YEAR, 'value.updatedAt': now, updatedAt: now } },
      )
      if (result.matchedCount !== 1) throw new Error('business_profile changed during the run; re-run the dry run.')
    }
    if (brandNeedsDescription) {
      const result = await db.collection('brands').updateOne({ slug: 'arf', description: arfBrand.description }, { $set: { description: ARF_DESCRIPTION, updatedAt: now } })
      if (result.matchedCount !== 1) throw new Error('ARF brand changed during the run; re-run the dry run.')
    }
    console.log(`[geo] Applied at ${now}.`)
  }
} finally {
  await client.close()
}
