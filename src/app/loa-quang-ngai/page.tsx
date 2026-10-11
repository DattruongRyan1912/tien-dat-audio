import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Clock3,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react'
import SonicDeferredMap from '@/components/sonic/SonicDeferredMap'
import SonicProductCard from '@/components/sonic/SonicProductCard'
import { getProducts } from '@/lib/catalog'
import { getBusinessProfile, formatPhoneHref } from '@/lib/business-profile'
import { listContentPosts } from '@/lib/content-repository'
import { absoluteSiteUrl, generateSEOMetadata } from '@/lib/seo'
import { getPublishedServiceAreas } from '@/lib/service-areas'

const pagePath = '/loa-quang-ngai'
const pageTitle = 'Loa Quảng Ngãi, Loa Karaoke Chính Hãng | Tiến Đạt Audio'
const pageDescription =
  'Mua loa Quảng Ngãi chính hãng: loa karaoke, loa sub, vang số ARF có sẵn tại showroom 264 Phan Đình Phùng. Nghe thử, phối ghép và lắp đặt tận nhà. Gọi 0934 995 657.'

const localFaqs = [
  {
    question: 'Showroom Tiến Đạt Audio ở đâu tại Quảng Ngãi?',
    answer:
      'Tiến Đạt Audio có showroom trực tiếp tại số 264 Phan Đình Phùng, Phường Cẩm Thành, Quảng Ngãi (trước sáp nhập là Phường Chánh Lộ, TP. Quảng Ngãi). Quý khách có thể ghé bất kỳ ngày nào trong tuần từ 08:00 đến 22:00.',
  },
  {
    question: 'Có được nghe thử và hát thử trước khi quyết định mua không?',
    answer:
      'Chắc chắn có. Showroom có phòng thử tiêu chuẩn âm học với các dòng loa karaoke, loa sub, vang số và main công suất để quý khách so sánh chất âm thực tế trước khi lựa chọn.',
  },
  {
    question: 'Tiến Đạt Audio hỗ trợ giao hàng và lắp đặt ở những khu vực nào?',
    answer:
      'Chúng tôi miễn phí giao hàng và hỗ trợ lắp đặt, cân chỉnh âm thanh tận nhà tại TP. Quảng Ngãi, Bình Sơn, Sơn Tịnh, Tư Nghĩa, Mộ Đức, Đức Phổ, Nghĩa Hành và các khu vực lân cận. Tiến Đạt Audio cũng giao hàng và lắp đặt tại khu vực Kon Tum (nay thuộc tỉnh Quảng Ngãi), Quảng Nam – Đà Nẵng và Bình Định – Gia Lai; vui lòng gọi trước để được báo lịch và chi phí lắp đặt.',
  },
  {
    question: 'Chính sách bảo hành và hỗ trợ kỹ thuật sau bán hàng ra sao?',
    answer:
      'Toàn bộ sản phẩm là hàng chính hãng 100%, bảo hành 12 - 24 tháng theo quy định nhà sản xuất. Đặc biệt, Tiến Đạt Audio hỗ trợ kỹ thuật, cân chỉnh chống hú rít trọn đời cho khách hàng.',
  },
  {
    question: 'Phòng khách 20 – 35m² nên chọn loa karaoke cỡ nào?',
    answer:
      'Phòng 20 – 35m² thường hợp với một cặp loa full bass 30cm (12 inch), vang số chống hú và main công suất phối đúng trở kháng; thêm một loa sub nếu thích tiếng trầm sâu. Kỹ thuật viên sẽ đo phòng thực tế trước khi chốt cấu hình để tránh dư bass hoặc ù tiếng.',
  },
  {
    question: 'Tiến Đạt Audio có bán loa ARF chính hãng tại Quảng Ngãi không?',
    answer:
      'Có. Showroom tại 264 Phan Đình Phùng đang có sẵn loa thùng, loa trầm, vang số và main công suất ARF chính hãng để nghe thử và phối ghép thành dàn karaoke hoàn chỉnh.',
  },
]

const speakerLines = [
  { label: 'Loa karaoke & nghe nhạc', href: '/products?category=loa-thung', note: 'Loa full đôi cho phòng khách, phòng hát gia đình và quán cafe.' },
  { label: 'Loa sub siêu trầm', href: '/products?category=loa-tram', note: 'Bổ sung dải trầm chắc, gọn cho phòng 20 – 40m².' },
  { label: 'Dàn karaoke trọn bộ', href: '/combos', note: 'Loa, vang số, cục đẩy và micro đã phối ghép sẵn theo diện tích phòng.' },
  { label: 'Vang số chống hú', href: '/products?category=vang-so', note: 'Xử lý tín hiệu, cắt hú rít để loa hát nhẹ và rõ lời.' },
]

const quangNgaiLocalities = ['TP. Quảng Ngãi', 'Bình Sơn', 'Sơn Tịnh', 'Tư Nghĩa', 'Nghĩa Hành', 'Mộ Đức', 'Đức Phổ', 'Lý Sơn', 'Khu vực Kon Tum']
const neighborRegions = [
  { slug: 'tam-ky-quang-nam', name: 'Tam Kỳ – Quảng Nam', localities: 'Tam Kỳ, Núi Thành, Hội An và Đà Nẵng' },
  { slug: 'quy-nhon-binh-dinh', name: 'Quy Nhơn – Bình Định', localities: 'Quy Nhơn, Hoài Nhơn' },
  { slug: 'pleiku-gia-lai', name: 'Pleiku – Gia Lai', localities: 'Pleiku' },
]

// Gợi ý chung theo diện tích; cấu hình cuối cùng chốt sau khi kỹ thuật viên đo phòng.
const roomGuide = [
  { area: 'Dưới 20m²', setup: 'Một cặp loa full bass 25cm (10 inch) + vang số, thường chưa cần loa sub.', note: 'Ưu tiên loa gọn, tránh dư bass gây ù.' },
  { area: '20 – 35m²', setup: 'Một cặp loa full bass 30cm (12 inch) + vang số + main công suất; thêm loa sub nếu thích trầm sâu.', note: 'Cấu hình phổ biến nhất cho phòng khách nhà phố.' },
  { area: 'Trên 35m², quán cafe, hội trường nhỏ', setup: 'Loa full bass 30 – 40cm, loa sub và main công suất dư 20 – 30% công suất loa.', note: 'Nên khảo sát tận nơi để đo âm học trước khi báo giá.' },
]

export const metadata: Metadata = generateSEOMetadata({
  pagePath,
  title: pageTitle,
  description: pageDescription,
  keywords: [
    'loa Quảng Ngãi',
    'bán loa Quảng Ngãi',
    'thiết bị âm thanh Quảng Ngãi',
    'cửa hàng âm thanh Quảng Ngãi',
    'loa nghe nhạc Quảng Ngãi',
    'loa karaoke Quảng Ngãi',
    'nghe thử loa Quảng Ngãi',
    'lắp đặt âm thanh Quảng Ngãi',
  ],
})

export const revalidate = 300

function pageStructuredData(
  profile: Awaited<ReturnType<typeof getBusinessProfile>>,
  products: Awaited<ReturnType<typeof getProducts>>
) {
  const baseUrl = profile.siteUrl.replace(/\/$/, '')
  const pageUrl = absoluteSiteUrl(pagePath)
  const businessId = `${baseUrl}#business`

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: pageTitle,
        description: pageDescription,
        inLanguage: 'vi-VN',
        isPartOf: { '@id': `${baseUrl}#website` },
        about: { '@id': businessId },
        areaServed: profile.areaServed,
        dateModified: profile.updatedAt,
        mainEntity: { '@id': `${pageUrl}#product-list` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: baseUrl },
          { '@type': 'ListItem', position: 2, name: 'Loa Quảng Ngãi', item: pageUrl },
        ],
      },
      {
        '@type': 'ItemList',
        '@id': `${pageUrl}#product-list`,
        name: 'Sản phẩm âm thanh tại Quảng Ngãi',
        numberOfItems: products.length,
        itemListElement: products.map((product, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Product',
            name: product.name,
            url: `${baseUrl}/san-pham/${product.slug}`,
            ...(product.images[0] ? { image: absoluteSiteUrl(product.images[0]) } : {}),
          },
        })),
      },
      {
        '@type': 'FAQPage',
        '@id': `${pageUrl}#faq`,
        mainEntity: localFaqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      },
    ],
  }
}

export default async function LocalQuangNgaiPage() {
  const [{ items: localArticles }, products, profile] = await Promise.all([
    listContentPosts({ search: 'Quảng Ngãi', limit: 6 }, true),
    getProducts({ limit: 8 }),
    getBusinessProfile(),
  ])
  const structuredData = pageStructuredData(profile, products)
  const phoneHref = formatPhoneHref(profile.phone)
  const publishedAreaSlugs = new Set(getPublishedServiceAreas().map((area) => area.slug))
  const stockedBrands = Array.from(new Map(products.filter((product) => product.brand_id).map((product) => [product.brand_id, product.brand])).entries())
  const updatedDate = new Date(profile.updatedAt)
  const updatedLabel = Number.isFinite(updatedDate.getTime()) ? updatedDate.toLocaleDateString('vi-VN') : null

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pt-28 pb-20 md:pt-36">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-[#d32f2f] transition-colors">
            Trang chủ
          </Link>
          <ChevronRight size={14} className="text-slate-400" />
          <span className="font-semibold text-slate-700">Loa Quảng Ngãi</span>
        </nav>

        {/* Hero Header */}
        <div className="mb-12 grid gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#d32f2f]">
              <MapPin size={14} /> Showroom chính hãng tại 264 Phan Đình Phùng
            </span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
              Loa Quảng Ngãi — Showroom nghe thử & lắp đặt tận nơi
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
              Tiến Đạt Audio chuyên tư vấn, cung cấp và lắp đặt thiết bị âm thanh chính hãng theo diện tích phòng thực tế. Nghe thử so sánh trực tiếp, giao hàng hỏa tốc và cân chỉnh âm học chuyên sâu tận nơi tại Quảng Ngãi.
            </p>
            {updatedLabel && <p className="mt-2 text-xs text-slate-500">Cập nhật: {updatedLabel}</p>}

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-xl bg-[#d32f2f] px-6 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#b71c1c]"
              >
                Xem danh mục sản phẩm
                <ArrowRight size={14} />
              </Link>
              <a
                href="https://zalo.me/0934995657"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#0068ff] px-6 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#0052cc]"
              >
                <MessageCircle size={14} />
                Chat Zalo Báo Giá
              </a>
              <a
                href={phoneHref}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                <Phone size={14} />
                Gọi: {profile.phone}
              </a>
            </div>
          </div>

          {/* Showroom Address Card */}
          <div className="lg:col-span-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-red-100 p-2.5 text-[#d32f2f]">
                <MapPin size={22} />
              </div>
              <div>
                <h2 className="text-xs font-bold uppercase text-slate-500">Địa chỉ nghe thử</h2>
                <p className="mt-0.5 text-sm font-bold text-slate-900">
                  {profile.address.formatted}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-600">
              <p className="flex items-center gap-2">
                <Clock3 size={14} className="text-amber-600 shrink-0" />
                Giờ mở cửa: {profile.businessHours.join(' / ')}
              </p>
              <p className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                100% Sản phẩm phân phối chính hãng
              </p>
              <p className="flex items-center gap-2">
                <Truck size={14} className="text-[#0068ff] shrink-0" />
                Giao hàng & lắp đặt tận nơi tại Quảng Ngãi
              </p>
            </div>

            <Link
              href="/contact"
              className="mt-5 block w-full rounded-xl bg-slate-100 py-2.5 text-center text-xs font-bold text-slate-800 transition hover:bg-slate-200"
            >
              Đặt lịch hẹn trước khi đến
            </Link>
          </div>
        </div>

        {/* 4 Steps Section */}
        <div className="mb-16 rounded-3xl border border-slate-200/90 bg-white p-8 shadow-sm md:p-10">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#d32f2f]">
              Quy trình chuẩn mực
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Cách Tiến Đạt Audio Phục Vụ Khách Hàng Tại Quảng Ngãi
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-100 bg-[#f8fafc] p-6">
              <span className="text-2xl font-extrabold text-[#d32f2f]">01</span>
              <h3 className="mt-3 text-base font-bold text-slate-900">Chọn Loa Theo Phòng</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Tính toán chính xác công suất loa phù hợp diện tích 15m², 25m², 40m² để âm bass không bị dội và treble không chói tai.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-[#f8fafc] p-6">
              <span className="text-2xl font-extrabold text-[#d32f2f]">02</span>
              <h3 className="mt-3 text-base font-bold text-slate-900">Nghe Thử So Sánh</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Đến trực tiếp showroom để nghe thử nhiều cấu hình khác nhau, thử giọng hát micro thực tế để cảm nhận chất âm ưng ý nhất.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-[#f8fafc] p-6">
              <span className="text-2xl font-extrabold text-[#d32f2f]">03</span>
              <h3 className="mt-3 text-base font-bold text-slate-900">Phối Ghép Chuẩn Xác</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Lựa chọn cục đẩy, amply, vang số tương thích hoàn hảo về trở kháng và công suất, đảm bảo độ bền tối đa cho dàn máy.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-[#f8fafc] p-6">
              <span className="text-2xl font-extrabold text-[#d32f2f]">04</span>
              <h3 className="mt-3 text-base font-bold text-slate-900">Lắp Đặt & Căn Chỉnh</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Kỹ thuật viên giao hàng tận nơi, đi dây thẩm mỹ và cân chỉnh DSP cắt sạch tiếng hú rít của micro tại phòng nhà bạn.
              </p>
            </div>
          </div>
        </div>

        {/* Speaker lines */}
        <section className="mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#d32f2f]">Danh mục tại showroom</span>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Các Dòng Loa Bán Tại Quảng Ngãi</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {speakerLines.map((line) => (
              <Link
                key={line.href}
                href={line.href}
                className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <h3 className="text-base font-bold text-slate-900 group-hover:text-[#d32f2f]">{line.label}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">{line.note}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#d32f2f]">
                  Xem sản phẩm <ArrowRight size={12} />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Room size guide */}
        <section className="mb-16 rounded-3xl border border-slate-200/90 bg-white p-8 shadow-sm md:p-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#d32f2f]">Tư vấn nhanh</span>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Chọn Loa Karaoke Theo Diện Tích Phòng</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th scope="col" className="py-2 pr-4">Diện tích</th>
                  <th scope="col" className="py-2 pr-4">Cấu hình gợi ý</th>
                  <th scope="col" className="py-2">Lưu ý</th>
                </tr>
              </thead>
              <tbody>
                {roomGuide.map((row) => (
                  <tr key={row.area} className="border-b border-slate-100 align-top">
                    <th scope="row" className="py-3 pr-4 font-bold text-slate-900">{row.area}</th>
                    <td className="py-3 pr-4 text-slate-700">{row.setup}</td>
                    <td className="py-3 text-slate-600">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            Đây là gợi ý chung. Mang kích thước phòng đến showroom hoặc gửi qua Zalo để kỹ thuật viên đề xuất cấu hình và nghe thử dàn tương đương trước khi mua.
          </p>
        </section>

        {/* Featured Products Grid */}
        <section className="mb-16">
          <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#d32f2f]">
                Sản phẩm nổi bật
              </span>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                Thiết Bị Sẵn Hàng Tại Showroom Quảng Ngãi
              </h2>
              {stockedBrands.length > 0 && (
                <p className="mt-1 text-xs text-slate-600">
                  Thương hiệu có sẵn:{' '}
                  {stockedBrands.map(([brandId, brandName], index) => (
                    <span key={brandId}>
                      {index > 0 && ', '}
                      <Link href={`/thuong-hieu/${brandId}`} className="font-semibold text-[#d32f2f] underline">
                        Loa {brandName} Quảng Ngãi
                      </Link>
                    </span>
                  ))}
                </p>
              )}
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#d32f2f] hover:underline"
            >
              Xem toàn bộ {products.length} sản phẩm <ArrowRight size={12} />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <SonicProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Service areas */}
        <section className="mb-16 grid gap-8 rounded-3xl border border-slate-200/90 bg-white p-8 shadow-sm md:p-10 lg:grid-cols-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#d32f2f]">Khu vực phục vụ</span>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">Giao Hàng & Lắp Đặt Loa Tại Quảng Ngãi Và Lân Cận</h2>
            <h3 className="mt-5 text-sm font-bold text-slate-900">Tỉnh Quảng Ngãi (gồm khu vực Kon Tum sau sáp nhập)</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {quangNgaiLocalities.join(', ')}.
              {publishedAreaSlugs.has('kon-tum') && (
                <>
                  {' '}
                  <Link href="/khu-vuc/kon-tum" className="font-semibold text-[#d32f2f] underline">Loa Kon Tum</Link>
                </>
              )}
            </p>
            <h3 className="mt-5 text-sm font-bold text-slate-900">Tỉnh lân cận</h3>
            <ul className="mt-2 space-y-2 text-sm leading-relaxed text-slate-600">
              {neighborRegions.map((region) => (
                <li key={region.slug}>
                  {publishedAreaSlugs.has(region.slug) ? (
                    <Link href={`/khu-vuc/${region.slug}`} className="font-semibold text-[#d32f2f] underline">
                      Loa {region.name}
                    </Link>
                  ) : (
                    <span className="font-semibold text-slate-800">{region.name}</span>
                  )}
                  : {region.localities}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs leading-relaxed text-slate-500">
              Showroom: {profile.address.formatted}.{' '}
              <a href={profile.mapUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#0068ff] underline">
                Chỉ đường Google Maps
              </a>
            </p>
          </div>
          <SonicDeferredMap embedUrl={profile.mapEmbedUrl} name={profile.name} />
        </section>

        {/* Local Knowledge Articles */}
        {localArticles.length > 0 && (
          <section className="mb-16 rounded-3xl border border-slate-200/90 bg-white p-8 shadow-sm md:p-10">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#0068ff]">
                  Tư vấn kinh nghiệm
                </span>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  Cẩm Nang Chọn Loa Tại Quảng Ngãi
                </h2>
              </div>
              <Link
                href="/kien-thuc"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#0068ff] hover:underline"
              >
                Xem tất cả bài viết <ArrowRight size={12} />
              </Link>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {localArticles.map((post) => (
                <Link
                  key={post.id}
                  href={`/kien-thuc/${post.slug}`}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-100 bg-[#f8fafc] p-5 transition hover:bg-white hover:shadow-md"
                >
                  <div>
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-[#0068ff]">
                      {post.category}
                    </span>
                    <h3 className="mt-3 text-base font-bold text-slate-900 transition-colors group-hover:text-[#0068ff]">
                      {post.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-600">
                      {post.excerpt}
                    </p>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#0068ff]">
                    Đọc tiếp <ArrowRight size={12} />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Local FAQs */}
        <section className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-[#d32f2f]">
              Hỏi đáp dịch vụ
            </span>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Câu Hỏi Thường Gặp Của Khách Hàng Tại Quảng Ngãi
            </h2>
          </div>

          <div className="mx-auto max-w-3xl space-y-3">
            {localFaqs.map((faq, idx) => (
              <details
                key={idx}
                className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all open:ring-1 open:ring-red-200"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-slate-900 transition-colors group-hover:text-[#d32f2f]">
                  <span className="text-sm font-bold leading-snug">{faq.question}</span>
                  <span className="shrink-0 rounded-full bg-slate-100 p-1 text-slate-500 transition-transform group-open:rotate-180 group-open:text-[#d32f2f]">
                    <ChevronDown size={16} />
                  </span>
                </summary>
                <p className="mt-3 border-t border-slate-100 pt-3 text-xs leading-relaxed text-slate-600">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Bottom Local CTA Banner */}
        <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-xl md:p-12">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-8">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-red-300">
                <Sparkles size={14} /> Trải nghiệm trực tiếp tại Quảng Ngãi
              </span>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-white md:text-3xl">
                Cần tư vấn một cấu hình âm thanh hoàn hảo cho căn phòng của bạn?
              </h2>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Đừng ngại ghé showroom 264 Phan Đình Phùng, TP. Quảng Ngãi để nghe thử miễn phí, hoặc gọi ngay Hotline để kỹ thuật viên tư vấn tận tình.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:col-span-4 lg:flex-col">
              <a
                href={phoneHref}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d32f2f] px-6 py-3.5 text-center text-sm font-bold text-white shadow-md transition hover:bg-[#b71c1c]"
              >
                <Phone size={16} />
                Gọi ngay: {profile.phone}
              </a>
              <a
                href="https://zalo.me/0934995657"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0068ff] px-6 py-3.5 text-center text-sm font-bold text-white shadow-md transition hover:bg-[#0052cc]"
              >
                <MessageCircle size={16} />
                Chat Zalo Báo Giá
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
