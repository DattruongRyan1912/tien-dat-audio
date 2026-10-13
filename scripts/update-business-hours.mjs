import { MongoClient } from 'mongodb'

// Đồng bộ giờ mở cửa với Google Business Profile: đóng cửa 21:00 (chủ cửa hàng xác nhận 2026-10-13).
// Sửa business_profile.businessHours và các câu entityFacts/FAQ đã sinh từ giờ cũ trong seo_strategy.
const apply = process.argv.includes('--apply')
const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB || 'tiendataudio'
const confirmation = process.env.CONFIRM_BUSINESS_HOURS || ''
const target = process.env.BUSINESS_HOURS_TARGET || 'local'

const OLD_HOURS = '08:00 - 22:00'
const NEW_HOURS = '08:00 - 21:00'
const localHosts = new Set(['localhost', '127.0.0.1', '::1'])

if (!uri) {
  console.error('[hours] MONGODB_URI is required.')
  process.exit(1)
}

let hostname = 'unknown'
try {
  hostname = new URL(uri).hostname
} catch {
  console.error('[hours] MONGODB_URI is invalid.')
  process.exit(1)
}

if (apply) {
  const isLocalApply = target === 'local' && localHosts.has(hostname)
  const isProductionApply = target === 'production' && localHosts.has(hostname) && confirmation === 'UPDATE-BUSINESS-HOURS'
  if (!isLocalApply && !isProductionApply) {
    console.error('[hours] Refusing to mutate: local apply requires BUSINESS_HOURS_TARGET=local; production requires BUSINESS_HOURS_TARGET=production and CONFIRM_BUSINESS_HOURS=UPDATE-BUSINESS-HOURS.')
    process.exit(1)
  }
}

const fix = (text) => text.split(OLD_HOURS).join(NEW_HOURS)

const client = new MongoClient(uri)
try {
  await client.connect()
  const settings = client.db(dbName).collection('site_settings')
  const [profileDoc, strategyDoc] = await Promise.all([settings.findOne({ key: 'business_profile' }), settings.findOne({ key: 'seo_strategy' })])
  if (!profileDoc?.value || !strategyDoc?.value) throw new Error('business_profile or seo_strategy is missing')
  const profile = profileDoc.value
  const strategy = strategyDoc.value

  const businessHours = profile.businessHours.map(fix)
  const entityFacts = strategy.ai.entityFacts.map(fix)
  const faqs = strategy.ai.faqs.map((faq) => ({ ...faq, answer: fix(faq.answer) }))
  const profileChanged = JSON.stringify(businessHours) !== JSON.stringify(profile.businessHours)
  const strategyChanged = JSON.stringify(entityFacts) !== JSON.stringify(strategy.ai.entityFacts) || JSON.stringify(faqs) !== JSON.stringify(strategy.ai.faqs)

  if (profileChanged) console.log(`[hours] businessHours: ${JSON.stringify(profile.businessHours)} -> ${JSON.stringify(businessHours)}`)
  const changedStrategyTexts = [...entityFacts.filter((fact, index) => fact !== strategy.ai.entityFacts[index]), ...faqs.filter((faq, index) => faq.answer !== strategy.ai.faqs[index].answer).map((faq) => faq.question)]
  changedStrategyTexts.forEach((text) => console.log(`[hours] seo_strategy: ${text.slice(0, 110)}`))
  const leftover = JSON.stringify([businessHours, entityFacts, faqs]).includes(OLD_HOURS)
  console.log(`[hours] profileChanged=${profileChanged} strategyTexts=${changedStrategyTexts.length} oldHoursLeft=${leftover}`)

  if (!apply) {
    console.log('[hours] Dry run only. Re-run with --apply to write.')
  } else if (!profileChanged && !strategyChanged) {
    console.log('[hours] Nothing to apply.')
  } else {
    const now = new Date().toISOString()
    // Ghi có điều kiện để không đè thay đổi admin lưu giữa lúc đọc và lúc ghi.
    if (profileChanged) {
      const result = await settings.updateOne({ key: 'business_profile', 'value.updatedAt': profile.updatedAt }, { $set: { 'value.businessHours': businessHours, 'value.updatedAt': now, updatedAt: now } })
      if (result.matchedCount !== 1) throw new Error('business_profile changed during the run; re-run the dry run.')
    }
    if (strategyChanged) {
      const result = await settings.updateOne(
        { key: 'seo_strategy', 'value.updatedAt': strategy.updatedAt },
        { $set: { 'value.ai.entityFacts': entityFacts, 'value.ai.faqs': faqs, 'value.updatedAt': now, updatedAt: now } },
      )
      if (result.matchedCount !== 1) throw new Error('seo_strategy changed during the run; re-run the dry run.')
    }
    console.log(`[hours] Applied at ${now}.`)
  }
} finally {
  await client.close()
}
