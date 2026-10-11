import { MongoClient } from 'mongodb'

// Cập nhật dữ liệu local SEO Quảng Ngãi trong MongoDB: địa chỉ sau sáp nhập 7/2025,
// khu vực phục vụ, keyword local trỏ vào bài chưa publish, keyword lõi còn thiếu,
// bỏ email/mạng xã hội không thuộc cửa hàng và đưa địa danh vào title sản phẩm.
const apply = process.argv.includes('--apply')
const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB || 'tiendataudio'
const confirmation = process.env.CONFIRM_LOCAL_SEO || ''
const target = process.env.LOCAL_SEO_TARGET || 'local'

const localHosts = new Set(['localhost', '127.0.0.1', '::1'])

if (!uri) {
  console.error('[local-seo] MONGODB_URI is required.')
  process.exit(1)
}

let hostname = 'unknown'
try {
  hostname = new URL(uri).hostname
} catch {
  console.error('[local-seo] MONGODB_URI is invalid.')
  process.exit(1)
}

if (apply) {
  const isLocalApply = target === 'local' && localHosts.has(hostname)
  const isProductionApply = target === 'production' && localHosts.has(hostname) && confirmation === 'UPDATE-LOCAL-SEO'
  if (!isLocalApply && !isProductionApply) {
    console.error('[local-seo] Refusing to mutate: local apply requires LOCAL_SEO_TARGET=local; production requires LOCAL_SEO_TARGET=production and CONFIRM_LOCAL_SEO=UPDATE-LOCAL-SEO.')
    process.exit(1)
  }
}

const OLD_ADDRESSES = [
  '264 Phan Đình Phùng, Phường Chánh Lộ, TP Quảng Ngãi',
  '264 Phan Đình Phùng, Chánh Lộ, Quảng Ngãi',
]
const NEW_ADDRESS = '264 Phan Đình Phùng, Phường Cẩm Thành, Quảng Ngãi'
const AREA_SERVED = ['Quảng Ngãi', 'Kon Tum', 'Quảng Nam', 'Đà Nẵng', 'Bình Định', 'Gia Lai']
// tiendataudio.com và các tài khoản @tiendataudio thuộc đơn vị khác (Tiến Đạt Audio Hà Nội / tài khoản không liên quan).
const SOCIAL_LINKS = ['https://www.facebook.com/amthanhtiendat']
const OLD_PRODUCT_TITLE_SUFFIX = ' - Tiến Đạt Audio | Chính hãng, giá tốt'
const NEW_PRODUCT_TITLE_SUFFIX = ' | Tiến Đạt Audio Quảng Ngãi'

// Keyword local đang trỏ vào bài /kien-thuc chưa publish (404).
const LOCAL_TARGETS = {
  'loa nghe nhạc chính hãng Quảng Ngãi': '/loa-quang-ngai',
  'mua loa karaoke ở Quảng Ngãi': '/loa-quang-ngai',
  'tư vấn phối ghép âm thanh Quảng Ngãi': '/loa-quang-ngai',
  'lắp đặt âm thanh gia đình Quảng Ngãi': '/kien-thuc/lap-dat-dan-karaoke-gia-dinh-quang-ngai',
  'lắp đặt karaoke phòng khách Quảng Ngãi': '/kien-thuc/lap-dat-dan-karaoke-gia-dinh-quang-ngai',
  'âm thanh hội trường Quảng Ngãi': '/loa-quang-ngai',
  'âm thanh quán cafe Quảng Ngãi': '/loa-quang-ngai',
  'âm thanh nhà thờ Quảng Ngãi': '/loa-quang-ngai',
  'cho thuê âm thanh sự kiện Quảng Ngãi': '/contact',
  'kiểm tra hệ thống âm thanh Quảng Ngãi': '/contact',
  'nghe thử loa Quảng Ngãi': '/loa-quang-ngai',
}

const CORE_LOCAL_KEYWORDS = [
  ['kw-local-loa-quang-ngai', 'loa Quảng Ngãi', 'local', '/loa-quang-ngai', 'core-local'],
  ['kw-local-ban-loa-quang-ngai', 'bán loa Quảng Ngãi', 'commercial', '/loa-quang-ngai', 'core-local'],
  ['kw-local-cua-hang-am-thanh-quang-ngai', 'cửa hàng âm thanh Quảng Ngãi', 'local', '/loa-quang-ngai', 'core-local'],
  ['kw-local-loa-karaoke-quang-ngai', 'loa karaoke Quảng Ngãi', 'commercial', '/loa-quang-ngai', 'core-local'],
  ['kw-local-showroom-am-thanh-quang-ngai', 'showroom âm thanh Quảng Ngãi', 'local', '/loa-quang-ngai', 'core-local'],
  ['kw-local-loa-nghe-nhac-quang-ngai', 'loa nghe nhạc Quảng Ngãi', 'commercial', '/loa-quang-ngai', 'core-local'],
  ['kw-local-dan-karaoke-quang-ngai', 'dàn karaoke Quảng Ngãi', 'local', '/', 'core-local'],
  ['kw-local-am-thanh-quang-ngai', 'âm thanh Quảng Ngãi', 'local', '/loa-quang-ngai', 'core-local'],
  ['kw-brand-arf-quang-ngai', 'loa ARF Quảng Ngãi', 'commercial', '/thuong-hieu/arf', 'brand-local'],
  ['kw-brand-tien-dat-audio-quang-ngai', 'Tiến Đạt Audio Quảng Ngãi', 'navigational', '/', 'brand'],
]

const replaceAddress = (value) => OLD_ADDRESSES.reduce((text, old) => text.split(old).join(NEW_ADDRESS), value)

const client = new MongoClient(uri)
try {
  await client.connect()
  const db = client.db(dbName)
  const settings = db.collection('site_settings')
  const now = new Date().toISOString()

  const profileDoc = await settings.findOne({ key: 'business_profile' })
  const strategyDoc = await settings.findOne({ key: 'seo_strategy' })
  if (!profileDoc?.value || !strategyDoc?.value) throw new Error('business_profile or seo_strategy is missing')

  const profile = profileDoc.value
  const nextProfile = {
    ...profile,
    address: {
      ...profile.address,
      streetAddress: '264 Phan Đình Phùng, Phường Cẩm Thành',
      formatted: '264 Phan Đình Phùng, Phường Cẩm Thành, Quảng Ngãi, Việt Nam',
    },
    areaServed: AREA_SERVED,
    email: '',
    socialLinks: SOCIAL_LINKS,
    updatedAt: now,
  }
  console.log(`[local-seo] address: ${profile.address.formatted} -> ${nextProfile.address.formatted}`)
  console.log(`[local-seo] areaServed: ${profile.areaServed.join(', ')} -> ${AREA_SERVED.join(', ')}`)
  console.log(`[local-seo] email: ${profile.email || '(trống)'} -> (trống); socialLinks: ${profile.socialLinks.length} -> ${SOCIAL_LINKS.length}`)

  const strategy = strategyDoc.value
  let retargeted = 0
  const keywords = strategy.keywords.map((keyword) => {
    const nextTarget = LOCAL_TARGETS[keyword.term]
    if (!nextTarget || nextTarget === keyword.targetPage) return keyword
    retargeted += 1
    console.log(`[local-seo] retarget "${keyword.term}": ${keyword.targetPage} -> ${nextTarget}`)
    return { ...keyword, targetPage: nextTarget, updatedAt: now }
  })
  const existingTerms = new Set(keywords.map((keyword) => keyword.term.toLocaleLowerCase('vi')))
  const added = CORE_LOCAL_KEYWORDS
    .filter(([, term]) => !existingTerms.has(term.toLocaleLowerCase('vi')))
    .map(([id, term, intent, targetPage, cluster]) => ({
      id,
      term,
      intent,
      targetPage,
      cluster,
      priority: 'high',
      notes: 'Keyword local/brand từ nghiên cứu SERP Quảng Ngãi 10/2026.',
      isActive: true,
      updatedAt: now,
    }))
  added.forEach((keyword) => console.log(`[local-seo] add "${keyword.term}" -> ${keyword.targetPage}`))
  const nextStrategy = {
    ...strategy,
    keywords: [...added, ...keywords],
    ai: {
      ...strategy.ai,
      entityFacts: strategy.ai.entityFacts.map(replaceAddress),
      faqs: strategy.ai.faqs.map((faq) => ({ ...faq, answer: replaceAddress(faq.answer) })),
    },
    updatedAt: now,
  }

  const posts = await db.collection('posts').find({ bodyMarkdown: /Chánh Lộ/ }, { projection: { slug: 1, bodyMarkdown: 1 } }).toArray()
  const postUpdates = posts.map((post) => ({ post, bodyMarkdown: replaceAddress(post.bodyMarkdown) }))
  postUpdates.forEach(({ post, bodyMarkdown }) => console.log(`[local-seo] post ${post.slug}: old address left=${bodyMarkdown.includes('Chánh Lộ')}`))

  const productTitleUpdates = (await db.collection('products').find({ 'seo.metaTitle': { $regex: ' - Tiến Đạt Audio \\| Chính hãng, giá tốt$' } }, { projection: { slug: 1, 'seo.metaTitle': 1 } }).toArray())
    .map((product) => ({ product, metaTitle: product.seo.metaTitle.replace(OLD_PRODUCT_TITLE_SUFFIX, NEW_PRODUCT_TITLE_SUFFIX) }))
  productTitleUpdates.forEach(({ product, metaTitle }) => console.log(`[local-seo] product ${product.slug}: ${metaTitle}`))

  const leftovers = JSON.stringify(nextStrategy).includes('Chánh Lộ') || postUpdates.some(({ bodyMarkdown }) => bodyMarkdown.includes('Chánh Lộ'))
  console.log(`[local-seo] retargeted=${retargeted} added=${added.length} posts=${postUpdates.length} products=${productTitleUpdates.length} oldAddressLeft=${leftovers}`)

  if (!apply) {
    console.log('[local-seo] Dry run only. Re-run with --apply to write.')
  } else {
    await settings.updateOne({ key: 'business_profile' }, { $set: { value: nextProfile, updatedAt: now } })
    await settings.updateOne({ key: 'seo_strategy' }, { $set: { value: nextStrategy, updatedAt: now } })
    for (const { post, bodyMarkdown } of postUpdates) {
      await db.collection('posts').updateOne({ _id: post._id }, { $set: { bodyMarkdown, updatedAt: now } })
    }
    for (const { product, metaTitle } of productTitleUpdates) {
      await db.collection('products').updateOne({ _id: product._id }, { $set: { 'seo.metaTitle': metaTitle, updatedAt: now } })
    }
    console.log(`[local-seo] Applied at ${now}.`)
  }
} finally {
  await client.close()
}
