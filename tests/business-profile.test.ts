import assert from 'node:assert/strict'
import { test } from 'node:test'
import fallbackProfile from '../data/business-profile.json'
import { normalizeBusinessProfile, validateBusinessProfile } from '../src/lib/business-profile'

test('business profile keeps one normalized NAP shape', () => {
  const profile = normalizeBusinessProfile({
    name: '  Tiến Đạt Audio  ',
    phone: '0934995657',
    email: 'CONTACT@EXAMPLE.COM',
    address: { formatted: '264 Phan Đình Phùng' },
    socialLinks: ['https://example.com', 'https://example.com'],
  })
  assert.equal(profile.name, 'Tiến Đạt Audio')
  assert.equal(profile.email, 'contact@example.com')
  assert.deepEqual(profile.socialLinks, ['https://example.com'])
  assert.equal(profile.address.formatted, '264 Phan Đình Phùng')
})

test('business profile validation rejects insecure canonical and invalid phone', () => {
  const result = validateBusinessProfile({ siteUrl: 'http://example.com', phone: '123', email: 'bad', address: { formatted: '' } })
  assert.ok(result.errors.length >= 3)
})

test('business profile allows an empty email but still rejects a malformed one', () => {
  assert.ok(!validateBusinessProfile({ ...fallbackProfile, email: '' }).errors.includes('Email không hợp lệ'))
  assert.ok(validateBusinessProfile({ ...fallbackProfile, email: 'bad' }).errors.includes('Email không hợp lệ'))
})

test('business profile keeps a valid founding year and drops malformed values', () => {
  assert.equal(normalizeBusinessProfile({ foundingDate: '2005' }).foundingDate, '2005')
  assert.equal(normalizeBusinessProfile({ foundingDate: 'năm 2005' }).foundingDate, undefined)
})
