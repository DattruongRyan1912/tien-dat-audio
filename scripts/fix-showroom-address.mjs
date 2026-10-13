import { randomUUID } from 'node:crypto'
import { MongoClient } from 'mongodb'

// Đồng bộ địa chỉ showroom trong bài viết với business_profile (sau sáp nhập: Phường Cẩm Thành, không còn "TP Quảng Ngãi").
// Sau khi apply, chạy `npm run assistant:migrate -- --apply` để rebuild article chunks theo version mới.
const apply = process.argv.includes('--apply')
const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB || 'tiendataudio'
const confirmation = process.env.CONFIRM_SHOWROOM_ADDRESS || ''
const target = process.env.SHOWROOM_ADDRESS_TARGET || 'local'
const actor = 'showroom-address-fix'

const NEW_ADDRESS = '264 Phan Đình Phùng, Phường Cẩm Thành, Quảng Ngãi'
const OLD_ADDRESS = /264 Phan Đình Phùng, (?:TP\.? Quảng Ngãi|Chánh Lộ, Quảng Ngãi)/g
const hasOldAddress = (value) => (JSON.stringify(value).match(OLD_ADDRESS) || []).length

const localHosts = new Set(['localhost', '127.0.0.1', '::1'])

if (!uri) {
  console.error('[showroom-address] MONGODB_URI is required.')
  process.exit(1)
}

let hostname = 'unknown'
try {
  hostname = new URL(uri).hostname
} catch {
  console.error('[showroom-address] MONGODB_URI is invalid.')
  process.exit(1)
}

if (apply) {
  const isLocalApply = target === 'local' && localHosts.has(hostname)
  const isProductionApply = target === 'production' && localHosts.has(hostname) && confirmation === 'FIX-SHOWROOM-ADDRESS'
  if (!isLocalApply && !isProductionApply) {
    console.error('[showroom-address] Refusing to mutate: local apply requires SHOWROOM_ADDRESS_TARGET=local; production requires SHOWROOM_ADDRESS_TARGET=production and CONFIRM_SHOWROOM_ADDRESS=FIX-SHOWROOM-ADDRESS.')
    process.exit(1)
  }
}

const replaceDeep = (value) => {
  if (typeof value === 'string') return value.replace(OLD_ADDRESS, NEW_ADDRESS)
  if (Array.isArray(value)) return value.map(replaceDeep)
  if (value && typeof value === 'object' && value.constructor === Object) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceDeep(item)]))
  return value
}

const client = new MongoClient(uri)
try {
  await client.connect()
  const db = client.db(dbName)
  const posts = db.collection('posts')
  const now = new Date().toISOString()

  const documents = await posts.find({}).toArray()
  const updates = []
  for (const document of documents) {
    const { _id, ...fields } = document
    const changed = Object.fromEntries(Object.entries(fields).filter(([key, value]) => key !== 'version' && JSON.stringify(replaceDeep(value)) !== JSON.stringify(value)).map(([key, value]) => [key, replaceDeep(value)]))
    if (!Object.keys(changed).length) continue
    const occurrences = hasOldAddress(fields)
    console.log(`[showroom-address] ${document.slug} [${document.status}] v${document.version}: ${occurrences} occurrence(s) in ${Object.keys(changed).join(', ')}`)
    updates.push({ _id, document, changed })
  }

  const left = documents.filter((document) => !updates.some((update) => update._id.equals(document._id)) && hasOldAddress(document))
  console.log(`[showroom-address] posts=${documents.length} toUpdate=${updates.length} untouchedWithOldAddress=${left.length}`)

  if (!apply) {
    console.log('[showroom-address] Dry run only. Re-run with --apply to write.')
  } else if (!updates.length) {
    console.log('[showroom-address] Nothing to apply.')
  } else {
    for (const { _id, document, changed } of updates) {
      const version = Number(document.version) || 1
      const result = await posts.updateOne({ _id, version: document.version }, { $set: { ...changed, updatedAt: now }, $inc: { version: 1 } })
      if (result.modifiedCount !== 1) throw new Error(`${document.slug} changed during the run; re-run the dry run (completed writes are kept and skipped next time).`)
      // Giống luồng admin: chỉ bài published mới lưu revision.
      if (document.status !== 'published') continue
      const { _id: _ignoredId, ...snapshot } = document
      void _ignoredId
      await db.collection('post_revisions').insertOne({ id: randomUUID(), postId: document.id, version, snapshot, reason: 'published_update', actor, createdAt: now })
    }
    console.log(`[showroom-address] Applied at ${now}. Next: rebuild article chunks with assistant:migrate.`)
  }
} finally {
  await client.close()
}
