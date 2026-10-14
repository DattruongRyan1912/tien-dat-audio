import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const readSource = (path: string) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('product hero is server-visible and gives its LCP image high priority', async () => {
  const [page, gallery] = await Promise.all([
    readSource('src/app/san-pham/[slug]/page.tsx'),
    readSource('src/components/sonic/SonicProductGallery.tsx'),
  ])

  assert.doesNotMatch(page, /<SonicReveal direction="left"><SonicProductGallery/)
  assert.doesNotMatch(page, /<SonicReveal direction="right"[^>]*className="flex flex-col justify-center"/)
  assert.match(gallery, /priority fetchPriority="high"/)
})

test('social hub keeps its LCP copy visible and optimizes only the leading gallery image eagerly', async () => {
  const [page, card, gallery] = await Promise.all([
    readSource('src/app/bai-viet/page.tsx'),
    readSource('src/components/social/SocialPostCard.tsx'),
    readSource('src/components/social/SocialMediaGallery.tsx'),
  ])

  assert.doesNotMatch(page, /<SonicReveal><section className="sonic-container pb-12 md:pb-16">/)
  assert.match(page, /index === 0\) return <SocialPostCard[^>]*priorityMedia/)
  assert.match(card, /<SocialMediaGallery media=\{post\.media\} priority=\{priorityMedia \|\| detail\}/)
  assert.match(gallery, /f_webp,fl_lossy,q_auto:eco,w_\$\{width\},c_limit/)
  assert.match(gallery, /srcSet=\{image\.srcSet\}/)
  assert.match(gallery, /fetchPriority=\{isPriority \? 'high' : undefined\}/)
  assert.doesNotMatch(gallery, /loading=\{index === 0 \? 'eager' : 'lazy'\}/)
})

test('footer map uses a deferred facade instead of an eager iframe', async () => {
  const [footer, deferredMap] = await Promise.all([
    readSource('src/components/sonic/SonicFooter.tsx'),
    readSource('src/components/sonic/SonicDeferredMap.tsx'),
  ])

  assert.doesNotMatch(footer, /<iframe/)
  assert.match(footer, /<SonicDeferredMap/)
  assert.match(deferredMap, /shouldLoad \? \(/)
  assert.match(deferredMap, /IntersectionObserver/)
})

test('public layout avoids request cookies and caches shared site settings', async () => {
  const [layout, settings] = await Promise.all([
    readSource('src/app/layout.tsx'),
    readSource('src/lib/public-site-settings.ts'),
  ])

  assert.doesNotMatch(layout, /from 'next\/headers'/)
  assert.match(layout, /getPublicSiteSettings/)
  assert.match(settings, /unstable_cache/)
  assert.match(settings, /revalidate: 300/)
})

test('theme hydration preserves the mode selected by the pre-paint bootstrap', async () => {
  const [layout, themeContext] = await Promise.all([
    readSource('src/app/layout.tsx'),
    readSource('src/contexts/ThemeContext.tsx'),
  ])

  assert.match(layout, /<script blocking="render" dangerouslySetInnerHTML=\{\{ __html: themeBootstrapScript \}\} \/>/)
  assert.match(themeContext, /const \[modeReady, setModeReady\] = useState\(false\)/)
  assert.match(themeContext, /applyMode\(nextResolved\)\s+setModeReady\(true\)/)
  assert.match(themeContext, /if \(!modeReady\) return/)
})

test('theme defaults to light on both sides of hydration and shares one storage key', async () => {
  const [layout, themeContext, themeStorage] = await Promise.all([
    readSource('src/app/layout.tsx'),
    readSource('src/contexts/ThemeContext.tsx'),
    readSource('src/lib/theme-storage.ts'),
  ])

  assert.match(layout, /<ThemeProvider initialMode="light">/)
  assert.match(layout, /localStorage\.getItem\('\$\{THEME_STORAGE_KEY\}'\)/)
  assert.match(themeContext, /import \{ THEME_STORAGE_KEY \} from '@\/lib\/theme-storage'/)
  assert.doesNotMatch(layout + themeContext, /'sonic_theme_mode'/)
  // Khoá mới đưa khách đã bị lưu nhầm chế độ tối về giao diện sáng.
  assert.match(themeStorage, /THEME_STORAGE_KEY = 'sonic_theme_mode_v2'/)
})

test('layout ships no Vercel-only analytics on the self-hosted VPS', async () => {
  const [layout, pkg] = await Promise.all([readSource('src/app/layout.tsx'), readSource('package.json')])

  assert.doesNotMatch(layout, /@vercel\//)
  assert.doesNotMatch(pkg, /@vercel\/(analytics|speed-insights)/)
})

test('assistant stays runtime-gated and its full widget loads only after interaction', async () => {
  const [layout, conditionalLayout, gate, sessionRoute] = await Promise.all([
    readSource('src/app/layout.tsx'),
    readSource('src/components/ConditionalLayout.tsx'),
    readSource('src/modules/assistant/presentation/AssistantWidgetGate.tsx'),
    readSource('src/app/api/assistant/session/route.ts'),
  ])

  assert.doesNotMatch(layout, /assistantPublicEnabled/)
  assert.match(conditionalLayout, /<AssistantWidgetGate/)
  assert.match(gate, /dynamic\(\(\) => import\('\.\/AssistantWidget'\)/)
  assert.match(gate, /if \(activated\) return <AssistantWidget initialOpen/)
  assert.match(sessionRoute, /enabled: assistantPublicEnabled\(\)/)
})

test('deployment keeps Next image variants in the writable shared cache', async () => {
  const deployScript = await readSource('deploy/scripts/deploy-release.sh')

  assert.match(deployScript, /shared\/next-image-cache/)
  assert.match(deployScript, /ln -s "\$image_cache_dir" "\$release_image_cache"/)
})
