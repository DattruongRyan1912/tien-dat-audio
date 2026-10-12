import { randomUUID } from 'node:crypto'
import { MongoClient } from 'mongodb'

// Đồng bộ coverage keyword của dashboard admin (tính theo posts.keywordIds, không theo targetPage):
// thêm keyword ID đã retarget vào keywordIds của bài published tương ứng (giữ nguyên bài draft),
// và bổ sung vào seo_strategy các keyword mà bài batch-2 đã publish đang gắn nhưng chưa tồn tại.
const apply = process.argv.includes('--apply')
const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB || 'tiendataudio'
const confirmation = process.env.CONFIRM_SEO_KEYWORD_SYNC || ''
const target = process.env.SEO_KEYWORD_SYNC_TARGET || 'local'
const actor = 'seo-keyword-sync'
const maxKeywordIds = 30

const localHosts = new Set(['localhost', '127.0.0.1', '::1'])

if (!uri) {
  console.error('[keyword-sync] MONGODB_URI is required.')
  process.exit(1)
}

let hostname = 'unknown'
try {
  hostname = new URL(uri).hostname
} catch {
  console.error('[keyword-sync] MONGODB_URI is invalid.')
  process.exit(1)
}

if (apply) {
  const isLocalApply = target === 'local' && localHosts.has(hostname)
  const isProductionApply = target === 'production' && localHosts.has(hostname) && confirmation === 'SYNC-SEO-KEYWORD-COVERAGE'
  if (!isLocalApply && !isProductionApply) {
    console.error('[keyword-sync] Refusing to mutate: local apply requires SEO_KEYWORD_SYNC_TARGET=local; production requires SEO_KEYWORD_SYNC_TARGET=production and CONFIRM_SEO_KEYWORD_SYNC=SYNC-SEO-KEYWORD-COVERAGE.')
    process.exit(1)
  }
}

// Keyword đã trỏ targetPage sang bài published nhưng bài chưa gắn ID — audit production 2026-10-11.
const POST_KEYWORDS = {
  'lap-dat-dan-karaoke-gia-dinh-quang-ngai': ['kw-q-027', 'kw-q-042', 'kw-q-043', 'kw-q-045', 'kw-q-048', 'kw-q-063', 'kw-q-064'],
  'cach-ghep-noi-vang-so-voi-cuc-day-cong-suat': ['kw-q-025', 'kw-q-051', 'kw-q-052', 'kw-q-090'],
  'dsp-audio-la-gi': ['kw-q-011', 'kw-q-084', 'kw-q-085'],
  'cach-chon-loa-nghe-nhac-cho-phong-khach': ['kw-q-014', 'kw-q-087', 'kw-q-089'],
  'loa-karaoke-bi-hu-nguyen-nhan-cach-khac-phuc': ['kw-q-021', 'kw-q-047', 'kw-q-086'],
  'dan-karaoke-gia-dinh-gia-bao-nhieu': ['kw-q-004', 'kw-q-005', 'kw-q-095'],
  'cach-chinh-vang-so-chong-hu-bang-may-tinh': ['kw-q-022', 'kw-q-028'],
  'kinh-nghiem-chon-micro-khong-day-karaoke-uhf': ['kw-q-019'],
  'so-sanh-vang-co-lai-so-va-vang-so': ['kw-q-012'],
  'loa-bass-bi-re-nguyen-nhan-va-cach-khac-phuc': ['kw-q-023'],
}

// ID bài batch-2 đã gắn nhưng thiếu trong seo_strategy; term = seoResearch.primaryKeyword trong data/editorial-seeds/batch-2/manifest.json.
const NEW_KEYWORDS = [
  { id: 'kw-tuning-digital-mixer', term: 'cách chỉnh vang số bằng máy tính', intent: 'informational', cluster: 'karaoke-troubleshooting', slug: 'cach-chinh-vang-so-chong-hu-bang-may-tinh' },
  { id: 'kw-connecting-mixer-amp', term: 'cách ghép nối vang số với cục đẩy', intent: 'informational', cluster: 'setup-maintenance', slug: 'cach-ghep-noi-vang-so-voi-cuc-day-cong-suat' },
  { id: 'kw-wireless-mic-guide', term: 'kinh nghiệm chọn micro không dây karaoke', intent: 'commercial', cluster: 'equipment-selection', slug: 'kinh-nghiem-chon-micro-khong-day-karaoke-uhf' },
  { id: 'kw-analog-vs-digital-mixer', term: 'so sánh vang cơ lai số và vang số', intent: 'commercial', cluster: 'equipment-selection', slug: 'so-sanh-vang-co-lai-so-va-vang-so' },
  { id: 'kw-rattling-bass-troubleshooting', term: 'loa bass bị rè', intent: 'informational', cluster: 'karaoke-troubleshooting', slug: 'loa-bass-bi-re-nguyen-nhan-va-cach-khac-phuc' },
]

const plannedIds = Object.values(POST_KEYWORDS).flat()
const duplicateIds = plannedIds.filter((id, index) => plannedIds.indexOf(id) !== index)
if (duplicateIds.length) throw new Error(`Keyword planned for more than one post: ${duplicateIds.join(', ')}`)

const normalizeTerm = (term) => term.trim().toLocaleLowerCase('vi')

const client = new MongoClient(uri)
try {
  await client.connect()
  const db = client.db(dbName)
  const settings = db.collection('site_settings')
  const postsCollection = db.collection('posts')
  const now = new Date().toISOString()
  const today = now.slice(0, 10)

  const strategyDoc = await settings.findOne({ key: 'seo_strategy' })
  if (!strategyDoc?.value) throw new Error('seo_strategy is missing')
  const strategy = strategyDoc.value

  const editorial = { $or: [{ contentType: 'editorial' }, { contentType: { $exists: false } }] }
  const posts = await postsCollection.find(editorial, { projection: { _id: 0, id: 1, slug: 1, status: 1, keywordIds: 1, version: 1 } }).toArray()
  const publishedBySlug = new Map(posts.filter((post) => post.status === 'published').map((post) => [post.slug, post]))
  const requiredSlugs = [...Object.keys(POST_KEYWORDS), ...NEW_KEYWORDS.map((keyword) => keyword.slug)]
  const missingPosts = [...new Set(requiredSlugs)].filter((slug) => !publishedBySlug.has(slug))
  if (missingPosts.length) throw new Error(`Target posts are not published: ${missingPosts.join(', ')}`)

  // 1) seo_strategy: thêm keyword còn thiếu, giữ nguyên keyword admin đã tạo cùng ID hoặc cùng term.
  const counts = { keywordAdded: 0, keywordUnchanged: 0, keywordSkipped: 0, idAdded: 0, idUnchanged: 0, idSkipped: 0, postsChanged: 0 }
  const additions = []
  for (const planned of NEW_KEYWORDS) {
    const existing = strategy.keywords.find((keyword) => keyword.id === planned.id)
    if (existing) {
      counts.keywordUnchanged += 1
      if (normalizeTerm(existing.term) !== normalizeTerm(planned.term)) console.warn(`[keyword-sync] ${planned.id} already exists with term "${existing.term}"; kept as is`)
      continue
    }
    const sameTerm = strategy.keywords.find((keyword) => normalizeTerm(keyword.term) === normalizeTerm(planned.term))
    if (sameTerm) {
      counts.keywordSkipped += 1
      console.warn(`[keyword-sync] skip ${planned.id}: term "${planned.term}" already used by ${sameTerm.id}`)
      continue
    }
    if (!(publishedBySlug.get(planned.slug).keywordIds || []).includes(planned.id)) {
      counts.keywordSkipped += 1
      console.warn(`[keyword-sync] skip ${planned.id}: ${planned.slug} no longer carries this ID`)
      continue
    }
    counts.keywordAdded += 1
    console.log(`[keyword-sync] add keyword ${planned.id} "${planned.term}" -> /kien-thuc/${planned.slug}`)
    additions.push({
      id: planned.id,
      term: planned.term,
      intent: planned.intent,
      targetPage: `/kien-thuc/${planned.slug}`,
      cluster: planned.cluster,
      priority: 'medium',
      notes: `Bổ sung ${today}: bài batch-2 (data/editorial-seeds/batch-2/manifest.json) đã publish với keyword ID này.`,
      isActive: true,
      updatedAt: now,
    })
  }
  const keywordsById = new Map([...strategy.keywords, ...additions].map((keyword) => [keyword.id, keyword]))

  // 2) posts: thêm ID vào bài published khi keyword vẫn active và vẫn trỏ đúng bài đó.
  const postUpdates = []
  for (const [slug, ids] of Object.entries(POST_KEYWORDS)) {
    const post = publishedBySlug.get(slug)
    const current = post.keywordIds || []
    const toAdd = ids.filter((id) => {
      if (current.includes(id)) {
        counts.idUnchanged += 1
        return false
      }
      const keyword = keywordsById.get(id)
      if (!keyword || keyword.isActive === false || keyword.targetPage !== `/kien-thuc/${slug}`) {
        counts.idSkipped += 1
        console.warn(`[keyword-sync] skip ${id} on ${slug}: keyword ${keyword ? `targets ${keyword.targetPage} (active=${keyword.isActive !== false})` : 'is missing'}`)
        return false
      }
      return true
    })
    if (!toAdd.length) continue
    const keywordIds = [...current, ...toAdd]
    if (keywordIds.length > maxKeywordIds) throw new Error(`${slug} would carry ${keywordIds.length} keywordIds (max ${maxKeywordIds})`)
    counts.idAdded += toAdd.length
    counts.postsChanged += 1
    console.log(`[keyword-sync] ${slug}: + ${toAdd.map((id) => `${id} "${keywordsById.get(id).term}"`).join(', ')}`)
    postUpdates.push({ post, keywordIds })
  }

  // Dự phóng coverage giống deriveContentSEOInsights; chặn nếu keyword do script đụng tới có hơn một bài published.
  const nextKeywordIds = new Map(postUpdates.map(({ post, keywordIds }) => [post.id, keywordIds]))
  const projected = posts.map((post) => nextKeywordIds.has(post.id) ? { ...post, keywordIds: nextKeywordIds.get(post.id) } : post)
  const publishedIdsByKeyword = new Map()
  projected.filter((post) => post.status === 'published').forEach((post) => (post.keywordIds || []).forEach((id) => publishedIdsByKeyword.set(id, [...(publishedIdsByKeyword.get(id) || []), post.slug])))
  const touchedIds = new Set([...plannedIds, ...NEW_KEYWORDS.map((keyword) => keyword.id)])
  const cannibalized = [...publishedIdsByKeyword].filter(([, slugs]) => slugs.length > 1)
  const blocking = cannibalized.filter(([id]) => touchedIds.has(id))
  if (blocking.length) throw new Error(`Cannibalization after sync: ${blocking.map(([id, slugs]) => `${id} -> ${slugs.join(', ')}`).join('; ')}`)
  cannibalized.forEach(([id, slugs]) => console.warn(`[keyword-sync] existing cannibalization (not touched): ${id} -> ${slugs.join(', ')}`))
  const articleStates = { published: 0, in_progress: 0, uncovered: 0 }
  ;[...keywordsById.values()].filter((keyword) => keyword.isActive !== false && publishedBySlug.has(keyword.targetPage.replace('/kien-thuc/', ''))).forEach((keyword) => {
    const mapped = projected.filter((post) => (post.keywordIds || []).includes(keyword.id) && post.status !== 'archived')
    articleStates[mapped.some((post) => post.status === 'published') ? 'published' : mapped.length ? 'in_progress' : 'uncovered'] += 1
  })
  const unknownIds = [...publishedIdsByKeyword.keys()].filter((id) => !keywordsById.has(id))

  console.log(`[keyword-sync] keywords=${keywordsById.size} keywordAdded=${counts.keywordAdded} keywordUnchanged=${counts.keywordUnchanged} keywordSkipped=${counts.keywordSkipped} idAdded=${counts.idAdded} idUnchanged=${counts.idUnchanged} idSkipped=${counts.idSkipped} postsChanged=${counts.postsChanged}`)
  console.log(`[keyword-sync] projected article keywords: published=${articleStates.published} in_progress=${articleStates.in_progress} uncovered=${articleStates.uncovered}; cannibalized=${cannibalized.length}; unknownPublishedIds=${unknownIds.length}`)

  if (!apply) {
    console.log('[keyword-sync] Dry run only. Re-run with --apply to write.')
  } else if (!additions.length && !postUpdates.length) {
    console.log('[keyword-sync] Nothing to apply.')
  } else {
    if (additions.length) {
      // Ghi có điều kiện để không đè thay đổi admin lưu giữa lúc đọc và lúc ghi.
      const result = await settings.updateOne(
        { key: 'seo_strategy', 'value.updatedAt': strategy.updatedAt },
        { $set: { value: { ...strategy, keywords: [...strategy.keywords, ...additions], updatedAt: now }, updatedAt: now } },
      )
      if (result.matchedCount !== 1) throw new Error('seo_strategy changed during the run; nothing written, re-run the dry run.')
    }
    // Không đổi updatedAt: nội dung bài không đổi. Tăng version để editor admin đang mở nhận VERSION_CONFLICT thay vì ghi đè.
    for (const { post, keywordIds } of postUpdates) {
      const document = await postsCollection.findOne({ id: post.id, status: 'published', version: post.version })
      const result = document && await postsCollection.updateOne({ id: post.id, status: 'published', version: post.version }, { $set: { keywordIds }, $inc: { version: 1 } })
      if (result?.modifiedCount !== 1) throw new Error(`${post.slug} changed during the run; re-run the dry run (completed writes are kept and skipped next time).`)
      const { _id: _ignoredId, ...snapshot } = document
      void _ignoredId
      await db.collection('post_revisions').insertOne({ id: randomUUID(), postId: post.id, version: post.version, snapshot, reason: 'published_update', actor, createdAt: now })
    }
    console.log(`[keyword-sync] Applied at ${now}.`)
  }
} finally {
  await client.close()
}
