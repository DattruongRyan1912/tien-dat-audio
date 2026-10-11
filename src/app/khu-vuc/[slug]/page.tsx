import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, ChevronDown, ChevronRight, MapPin, MessageCircle, Phone, Truck, Wrench } from 'lucide-react'
import SonicProductCard from '@/components/sonic/SonicProductCard'
import { getProducts } from '@/lib/catalog'
import { getBusinessProfile, formatPhoneHref } from '@/lib/business-profile'
import { absoluteSiteUrl, generateSEOMetadata } from '@/lib/seo'
import { getPublishedServiceArea, getPublishedServiceAreas } from '@/lib/service-areas'

type ServiceAreaPageProps = { params: Promise<{ slug: string }> }

export const revalidate = 300

export function generateStaticParams() {
  return getPublishedServiceAreas().map((area) => ({ slug: area.slug }))
}

export async function generateMetadata({ params }: ServiceAreaPageProps): Promise<Metadata> {
  const { slug } = await params
  const area = getPublishedServiceArea(slug)
  if (!area) return { title: 'Khu vực không tồn tại — Tiến Đạt Audio', robots: { index: false } }
  return generateSEOMetadata({
    title: `Loa ${area.name} | Giao & lắp đặt tận nơi — Tiến Đạt Audio`,
    description: area.summary,
    url: `/khu-vuc/${area.slug}`,
    keywords: area.searchNames.flatMap((name) => [`loa ${name}`, `loa karaoke ${name}`, `thiết bị âm thanh ${name}`]),
  })
}

export default async function ServiceAreaPage({ params }: ServiceAreaPageProps) {
  const { slug } = await params
  const area = getPublishedServiceArea(slug)
  if (!area) notFound()

  const [profile, products] = await Promise.all([getBusinessProfile(), getProducts({ limit: 4 })])
  const baseUrl = profile.siteUrl.replace(/\/$/, '')
  const pageUrl = absoluteSiteUrl(`/khu-vuc/${area.slug}`)
  const businessId = `${baseUrl}#business`
  const phoneHref = formatPhoneHref(profile.phone)
  const zaloHref = `https://zalo.me/${profile.phone.replace(/\D/g, '')}`

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: `Loa ${area.name} — Tiến Đạt Audio`,
        description: area.summary,
        inLanguage: 'vi-VN',
        isPartOf: { '@id': `${baseUrl}#website` },
        about: { '@id': `${pageUrl}#service` },
      },
      {
        '@type': 'Service',
        '@id': `${pageUrl}#service`,
        name: `Cung cấp và lắp đặt loa, thiết bị âm thanh tại ${area.name}`,
        serviceType: 'Lắp đặt hệ thống âm thanh',
        provider: { '@id': businessId },
        areaServed: [...area.searchNames, ...area.localities].map((name) => ({ '@type': 'AdministrativeArea', name })),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: baseUrl },
          { '@type': 'ListItem', position: 2, name: 'Loa Quảng Ngãi', item: absoluteSiteUrl('/loa-quang-ngai') },
          { '@type': 'ListItem', position: 3, name: `Loa ${area.name}`, item: pageUrl },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${pageUrl}#faq`,
        mainEntity: area.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      },
    ],
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pt-28 pb-20 md:pt-36">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-[#d32f2f] transition-colors">Trang chủ</Link>
          <ChevronRight size={14} className="text-slate-400" />
          <Link href="/loa-quang-ngai" className="hover:text-[#d32f2f] transition-colors">Loa Quảng Ngãi</Link>
          <ChevronRight size={14} className="text-slate-400" />
          <span className="font-semibold text-slate-700">Loa {area.name}</span>
        </nav>

        <header className="mb-12 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#d32f2f]">
            <MapPin size={14} /> {area.distance}
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
            Loa {area.name} — Giao hàng & lắp đặt tận nơi
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">{area.summary}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={phoneHref} className="inline-flex items-center gap-2 rounded-xl bg-[#d32f2f] px-6 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#b71c1c]">
              <Phone size={14} /> Gọi: {profile.phone}
            </a>
            <a href={zaloHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#0068ff] px-6 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#0052cc]">
              <MessageCircle size={14} /> Chat Zalo Báo Giá
            </a>
          </div>
        </header>

        <div className="mb-16 grid gap-6 md:grid-cols-2">
          <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><Truck size={18} className="text-[#0068ff]" /> Giao hàng</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{area.delivery}</p>
          </section>
          <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><Wrench size={18} className="text-[#d32f2f]" /> Lắp đặt & cân chỉnh</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{area.installation}</p>
          </section>
        </div>

        <section className="mb-16 rounded-3xl border border-slate-200/90 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Công trình đã thực hiện tại {area.name}</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-600">
            {area.projects.map((project) => <li key={project}>{project}</li>)}
          </ul>
          {area.localities.length > 0 && (
            <p className="mt-4 text-sm text-slate-600">Khu vực phục vụ: {area.localities.join(', ')}.</p>
          )}
        </section>

        <section className="mb-16">
          <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Thiết bị giao đến {area.name}</h2>
            <Link href="/products" className="inline-flex items-center gap-1 text-xs font-bold text-[#d32f2f] hover:underline">
              Xem toàn bộ sản phẩm <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => <SonicProductCard key={product.id} product={product} />)}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="mb-6 text-center text-2xl font-bold tracking-tight text-slate-900">Câu hỏi thường gặp tại {area.name}</h2>
          <div className="mx-auto max-w-3xl space-y-3">
            {area.faqs.map((faq) => (
              <details key={faq.question} className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-slate-900">
                  {faq.question}
                  <ChevronDown size={16} className="shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 border-t border-slate-100 pt-3 text-xs leading-relaxed text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <p className="text-center text-sm text-slate-600">
          Showroom nghe thử: {profile.address.formatted}.{' '}
          <Link href="/loa-quang-ngai" className="font-semibold text-[#d32f2f] underline">Xem showroom loa Quảng Ngãi</Link>
        </p>
      </div>
    </div>
  )
}
