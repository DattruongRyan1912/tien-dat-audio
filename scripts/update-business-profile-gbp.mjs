import { MongoClient } from 'mongodb'

// Gắn Google Business Profile thật của cửa hàng (CID lấy từ hồ sơ chủ sở hữu, xác minh 2026-10-13: 264 Phan Đình Phùng, Cẩm Thành, Quảng Ngãi 53000)
// làm mapUrl + sameAs, thay link tìm kiếm chung "Tiến Đạt Audio" có thể trả về cửa hàng cùng tên ở tỉnh khác.
const apply = process.argv.includes('--apply')
const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB || 'tiendataudio'
const confirmation = process.env.CONFIRM_BUSINESS_GBP || ''
const target = process.env.BUSINESS_GBP_TARGET || 'local'

const GBP_URL = 'https://maps.google.com/?cid=1617460810128453419'
const POSTAL_CODE = '53000'
const localHosts = new Set(['localhost', '127.0.0.1', '::1'])

if (!uri) {
  console.error('[gbp] MONGODB_URI is required.')
  process.exit(1)
}

let hostname = 'unknown'
try {
  hostname = new URL(uri).hostname
} catch {
  console.error('[gbp] MONGODB_URI is invalid.')
  process.exit(1)
}

if (apply) {
  const isLocalApply = target === 'local' && localHosts.has(hostname)
  const isProductionApply = target === 'production' && localHosts.has(hostname) && confirmation === 'UPDATE-BUSINESS-GBP'
  if (!isLocalApply && !isProductionApply) {
    console.error('[gbp] Refusing to mutate: local apply requires BUSINESS_GBP_TARGET=local; production requires BUSINESS_GBP_TARGET=production and CONFIRM_BUSINESS_GBP=UPDATE-BUSINESS-GBP.')
    process.exit(1)
  }
}

const client = new MongoClient(uri)
try {
  await client.connect()
  const settings = client.db(dbName).collection('site_settings')
  const doc = await settings.findOne({ key: 'business_profile' })
  if (!doc?.value) throw new Error('business_profile is missing')
  const profile = doc.value
  const socialLinks = Array.isArray(profile.socialLinks) ? profile.socialLinks : []

  const changes = {}
  if (profile.mapUrl !== GBP_URL) changes['value.mapUrl'] = GBP_URL
  if (!socialLinks.includes(GBP_URL)) changes['value.socialLinks'] = [...socialLinks, GBP_URL]
  if (!profile.address?.postalCode) changes['value.address.postalCode'] = POSTAL_CODE
  else if (profile.address.postalCode !== POSTAL_CODE) console.warn(`[gbp] keep existing postalCode ${profile.address.postalCode}`)

  Object.entries(changes).forEach(([field, value]) => console.log(`[gbp] ${field}: ${JSON.stringify(field === 'value.mapUrl' ? profile.mapUrl : field === 'value.socialLinks' ? socialLinks : profile.address?.postalCode)} -> ${JSON.stringify(value)}`))
  console.log(`[gbp] changes=${Object.keys(changes).length}`)

  if (!apply) {
    console.log('[gbp] Dry run only. Re-run with --apply to write.')
  } else if (!Object.keys(changes).length) {
    console.log('[gbp] Nothing to apply.')
  } else {
    const now = new Date().toISOString()
    // Ghi có điều kiện để không đè thay đổi admin lưu giữa lúc đọc và lúc ghi.
    const result = await settings.updateOne(
      { key: 'business_profile', 'value.updatedAt': profile.updatedAt },
      { $set: { ...changes, 'value.updatedAt': now, updatedAt: now } },
    )
    if (result.matchedCount !== 1) throw new Error('business_profile changed during the run; nothing written, re-run the dry run.')
    console.log(`[gbp] Applied at ${now}.`)
  }
} finally {
  await client.close()
}
