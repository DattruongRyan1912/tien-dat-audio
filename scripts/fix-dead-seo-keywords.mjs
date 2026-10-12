import { MongoClient } from 'mongodb'

// Xử lý keyword non-local trong seo_strategy đang trỏ vào bài /kien-thuc chưa publish (404 trong /llms.txt):
// trỏ sang bài đã publish có mục trả lời trực tiếp, trỏ keyword dịch vụ/mua hàng về hub,
// tắt keyword hỏi đáp chưa có bài (giữ slug dự kiến để bật lại khi publish).
const apply = process.argv.includes('--apply')
const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB || 'tiendataudio'
const confirmation = process.env.CONFIRM_DEAD_SEO_KEYWORDS || ''
const target = process.env.DEAD_SEO_KEYWORDS_TARGET || 'local'

const localHosts = new Set(['localhost', '127.0.0.1', '::1'])

if (!uri) {
  console.error('[dead-keywords] MONGODB_URI is required.')
  process.exit(1)
}

let hostname = 'unknown'
try {
  hostname = new URL(uri).hostname
} catch {
  console.error('[dead-keywords] MONGODB_URI is invalid.')
  process.exit(1)
}

if (apply) {
  const isLocalApply = target === 'local' && localHosts.has(hostname)
  const isProductionApply = target === 'production' && localHosts.has(hostname) && confirmation === 'FIX-DEAD-SEO-KEYWORDS'
  if (!isLocalApply && !isProductionApply) {
    console.error('[dead-keywords] Refusing to mutate: local apply requires DEAD_SEO_KEYWORDS_TARGET=local; production requires DEAD_SEO_KEYWORDS_TARGET=production and CONFIRM_DEAD_SEO_KEYWORDS=FIX-DEAD-SEO-KEYWORDS.')
    process.exit(1)
  }
}

// Bài đã publish có mục (H2/H3) trả lời trực tiếp keyword — đối chiếu nội dung production 2026-10-11.
const ARTICLE_TARGETS = {
  'so-sanh-vang-co-lai-so-va-vang-so': ['vang cơ hay vang số'],
  'dsp-audio-la-gi': ['amply hay vang số cho karaoke gia đình', 'crossover là gì', 'compressor audio là gì', 'limiter âm thanh là gì'],
  'cach-chon-loa-nghe-nhac-cho-phong-khach': ['phối công suất loa và amply', 'công suất RMS và peak', 'trở kháng loa là gì'],
  'loa-karaoke-bi-hu-nguyen-nhan-cach-khac-phuc': ['micro karaoke bị rít', 'hướng loa karaoke chống hú', 'feedback suppressor là gì'],
  'cach-chinh-vang-so-chong-hu-bang-may-tinh': ['cách chỉnh micro karaoke không bị hú', 'vang số bị mất cấu hình'],
  'cach-ghep-noi-vang-so-voi-cuc-day-cong-suat': ['cách đấu nối loa và amply karaoke', 'thứ tự bật tắt dàn âm thanh', 'balanced và unbalanced audio', 'âm thanh karaoke bị ù'],
  'kinh-nghiem-chon-micro-khong-day-karaoke-uhf': ['micro không dây bị nhiễu'],
  'loa-bass-bi-re-nguyen-nhan-va-cach-khac-phuc': ['loa karaoke bị rè'],
  'lap-dat-dan-karaoke-gia-dinh-quang-ngai': ['tiếng bass bị ù phòng karaoke', 'cách xử lý tiếng vang phòng khách', 'phòng karaoke gia đình có cần tiêu âm không', 'rèm thảm ảnh hưởng âm thanh', 'đặt loa sub vị trí nào'],
  'dan-karaoke-gia-dinh-gia-bao-nhieu': ['chọn thiết bị âm thanh theo ngân sách', 'dàn karaoke gia đình phòng 15m2', 'dàn karaoke gia đình phòng 20m2'],
}

// Keyword dịch vụ/mua hàng chưa có bài: trỏ về hub có thật.
const HUB_TARGETS = {
  '/contact': [
    'đo âm thanh phòng gia đình', 'thiết kế phòng nghe nhạc tại nhà',
    'mua dàn karaoke mới hay nâng cấp', 'cách so sánh báo giá dàn karaoke', 'có nên nghe thử loa trước khi mua', 'checklist tư vấn mua thiết bị âm thanh',
    'chọn loa cho quán cafe', 'âm thanh quán cafe nhỏ', 'âm thanh cho nhà hàng', 'âm thanh cho cửa hàng', 'âm thanh phòng họp',
    'âm thanh lớp học', 'âm thanh hội trường nhỏ', 'âm thanh sân khấu mini', 'micro phát biểu không dây', 'loa ngoài trời cho sự kiện',
  ],
  '/combos': [
    'dàn karaoke cho phòng khách mở', 'dàn karaoke gia đình cho chung cư', 'dàn karaoke gia đình nghe nhạc và hát',
    'dàn karaoke gia đình 2 micro hay 4 micro', 'dàn karaoke gia đình có cần loa sub không', 'mua combo âm thanh hay từng món',
  ],
  '/products': ['loa bookshelf hay floorstanding', 'loa nghe nhạc cho phòng 20m2', 'loa nghe nhạc vocal', 'loa nghe nhạc bolero'],
}

// Keyword hỏi đáp/so sánh chưa có bài: tắt, giữ targetPage là slug dự kiến.
const DEACTIVATE = [
  'cục đẩy công suất là gì', 'loa full range là gì', 'loa active hay passive', 'loa 2 đường tiếng hay 3 đường tiếng',
  'micro có dây hay không dây karaoke', 'đầu karaoke online hay smart tv',
  'loa karaoke mất tiếng một bên', 'hát karaoke bị trễ tiếng', 'micro karaoke không nhận tín hiệu', 'amply karaoke bị nóng',
  'tiêu âm và cách âm khác nhau', 'đặt loa karaoke cách tường', 'kê loa bookshelf đúng cách',
  'vệ sinh loa karaoke đúng cách', 'bảo quản micro không dây', 'cách kiểm tra dây loa bị lỗi', 'nguồn điện cho dàn âm thanh',
  'bảo dưỡng vang số', 'khi nào nên thay dây loa', 'cách test loa trước khi nhận', 'checklist nghiệm thu dàn karaoke',
  'EQ graphic hay parametric', 'độ nhạy loa là gì',
  'lỗi khi tự lắp dàn karaoke', 'bao lâu nên cân chỉnh hệ thống âm thanh', 'chuẩn bị phòng trước khi lắp đặt âm thanh', 'xu hướng karaoke gia đình 2026',
  'loa nghe nhạc acoustic', 'loa hi-fi có cần amply không', 'cách bố trí loa stereo 2 kênh', 'nghe nhạc lossless cần thiết bị gì',
]

const plan = new Map()
const addPlan = (term, action) => {
  if (plan.has(term)) throw new Error(`Duplicate plan entry: ${term}`)
  plan.set(term, action)
}
Object.entries(ARTICLE_TARGETS).forEach(([slug, terms]) => terms.forEach((term) => addPlan(term, { type: 'article', targetPage: `/kien-thuc/${slug}` })))
Object.entries(HUB_TARGETS).forEach(([hub, terms]) => terms.forEach((term) => addPlan(term, { type: 'hub', targetPage: hub })))
DEACTIVATE.forEach((term) => addPlan(term, { type: 'deactivate' }))

const withNote = (notes, note) => (notes || '').includes(note) ? notes : [note, notes].filter(Boolean).join(' ')

const client = new MongoClient(uri)
try {
  await client.connect()
  const db = client.db(dbName)
  const settings = db.collection('site_settings')
  const now = new Date().toISOString()
  const today = now.slice(0, 10)

  const strategyDoc = await settings.findOne({ key: 'seo_strategy' })
  if (!strategyDoc?.value) throw new Error('seo_strategy is missing')
  const strategy = strategyDoc.value

  const publishedSlugs = new Set((await db.collection('posts').find({ status: 'published' }, { projection: { slug: 1 } }).toArray()).map((post) => post.slug))
  const isDeadTarget = (page) => page.startsWith('/kien-thuc/') && !publishedSlugs.has(page.slice('/kien-thuc/'.length))
  const missingArticles = Object.keys(ARTICLE_TARGETS).filter((slug) => !publishedSlugs.has(slug))
  if (missingArticles.length) throw new Error(`Article targets are not published: ${missingArticles.join(', ')}`)

  const counts = { article: 0, hub: 0, deactivate: 0, unchanged: 0, skipped: 0 }
  const seenTerms = new Set()
  const keywords = strategy.keywords.map((keyword) => {
    const action = plan.get(keyword.term)
    if (!action) return keyword
    seenTerms.add(keyword.term)
    const done = action.type === 'deactivate' ? keyword.isActive === false : keyword.targetPage === action.targetPage
    if (done) {
      counts.unchanged += 1
      return keyword
    }
    // Chỉ sửa keyword vẫn đang trỏ vào bài chưa publish; target đã được admin đổi thì giữ nguyên.
    if (!isDeadTarget(keyword.targetPage)) {
      counts.skipped += 1
      console.warn(`[dead-keywords] skip "${keyword.term}": targetPage ${keyword.targetPage} is no longer a dead article link`)
      return keyword
    }
    counts[action.type] += 1
    if (action.type === 'deactivate') {
      console.log(`[dead-keywords] deactivate "${keyword.term}" (keeps ${keyword.targetPage})`)
      return { ...keyword, isActive: false, notes: withNote(keyword.notes, `Tạm tắt ${today}: bài ${keyword.targetPage} chưa publish; bật lại khi publish.`), updatedAt: now }
    }
    console.log(`[dead-keywords] ${action.type} "${keyword.term}": ${keyword.targetPage} -> ${action.targetPage}`)
    return { ...keyword, targetPage: action.targetPage, notes: withNote(keyword.notes, `Bài riêng dự kiến: ${keyword.targetPage}.`), updatedAt: now }
  })

  const missingTerms = [...plan.keys()].filter((term) => !seenTerms.has(term))
  missingTerms.forEach((term) => console.warn(`[dead-keywords] plan term not found: "${term}"`))
  const remainingDead = keywords.filter((keyword) => keyword.isActive !== false && isDeadTarget(keyword.targetPage))
  remainingDead.forEach((keyword) => console.warn(`[dead-keywords] still dead and active: "${keyword.term}" -> ${keyword.targetPage}`))
  const changed = counts.article + counts.hub + counts.deactivate
  console.log(`[dead-keywords] keywords=${keywords.length} article=${counts.article} hub=${counts.hub} deactivate=${counts.deactivate} unchanged=${counts.unchanged} skipped=${counts.skipped} missing=${missingTerms.length} remainingDeadActive=${remainingDead.length}`)

  if (!apply) {
    console.log('[dead-keywords] Dry run only. Re-run with --apply to write.')
  } else if (!changed) {
    console.log('[dead-keywords] Nothing to apply.')
  } else {
    // Ghi có điều kiện để không đè thay đổi admin lưu giữa lúc đọc và lúc ghi.
    const result = await settings.updateOne(
      { key: 'seo_strategy', 'value.updatedAt': strategy.updatedAt },
      { $set: { value: { ...strategy, keywords, updatedAt: now }, updatedAt: now } },
    )
    if (result.matchedCount !== 1) throw new Error('seo_strategy changed during the run; nothing written, re-run the dry run.')
    console.log(`[dead-keywords] Applied at ${now}.`)
  }
} finally {
  await client.close()
}
