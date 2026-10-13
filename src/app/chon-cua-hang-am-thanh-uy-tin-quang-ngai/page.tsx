import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, ChevronDown, ChevronRight, MapPin, Phone, XCircle } from 'lucide-react'
import { getBusinessProfile, formatPhoneHref } from '@/lib/business-profile'
import { absoluteSiteUrl, generateSEOMetadata } from '@/lib/seo'

const pagePath = '/chon-cua-hang-am-thanh-uy-tin-quang-ngai'
const pageTitle = 'Cách chọn cửa hàng âm thanh uy tín tại Quảng Ngãi | Tiến Đạt Audio'
const pageDescription =
  'Mua loa karaoke ở đâu uy tín tại Quảng Ngãi? 7 tiêu chí kiểm tra cửa hàng âm thanh trước khi mua: showroom thật, nghe thử, tư vấn theo phòng, bảo hành, lắp đặt và cân chỉnh.'

// Tiêu chí trung lập cho người mua; cột "Tiến Đạt Audio" chỉ dùng dữ kiện đã công bố trên site và business profile.
const criteria = [
  { title: 'Có showroom và địa chỉ cố định', detail: 'Địa chỉ trên website, fanpage và Google Maps phải trùng nhau. Cửa hàng chỉ bán online, không có nơi ghé xem, khó hỗ trợ khi cần bảo hành.', tienDat: 'showroom' },
  { title: 'Cho nghe thử, hát thử trước khi mua', detail: 'Loa nghe ở phòng thử, với chính bài hát và giọng của bạn, mới phản ánh đúng chất âm. Thông số trên giấy không thay được việc nghe thực tế.', tienDat: 'Có phòng thử để nghe và hát thử loa, vang số, main công suất trước khi chọn.' },
  { title: 'Tư vấn theo diện tích và mục đích', detail: 'Nơi uy tín hỏi diện tích phòng, vật liệu, nhu cầu hát hay nghe nhạc, rồi mới đề xuất cấu hình; không ép mua combo đắt nhất.', tienDat: 'Tư vấn phối ghép loa, vang số, main công suất theo không gian và ngân sách.' },
  { title: 'Hàng chính hãng, thông tin rõ ràng', detail: 'Mỗi thiết bị cần có tên model, xuất xứ, thông số và thời hạn bảo hành cụ thể. Hãy hỏi rõ trước khi thanh toán.', tienDat: 'Mỗi trang sản phẩm ghi rõ model; hãy hỏi trực tiếp để nhận thông tin xuất xứ và thời hạn bảo hành của từng thiết bị.' },
  { title: 'Lắp đặt và cân chỉnh sau bán', detail: 'Cùng một bộ dàn, cân chỉnh sai sẽ hú rít và hát mệt. Hỏi cửa hàng có lắp đặt, chỉnh vang số chống hú tại nhà không.', tienDat: 'Lắp đặt và cân chỉnh âm thanh tận nơi trong khu vực phục vụ.' },
  { title: 'Báo giá theo từng thiết bị', detail: 'Báo giá nên tách từng món (loa, vang, main, micro, dây, công lắp) để so sánh được giữa các nơi.', tienDat: 'Báo giá theo cấu hình qua hotline hoặc Zalo.' },
  { title: 'Đánh giá thật của khách', detail: 'Đọc đánh giá trên Google Maps và fanpage, ưu tiên đánh giá có ảnh công trình thật; cảnh giác với lời tự xưng "số 1".', tienDat: 'Bạn có thể xem fanpage chính thức và ghé showroom để kiểm tra trực tiếp.' },
]

const notOffered = ['Không nhận sửa loa', 'Không cho thuê thiết bị âm thanh', 'Không bán loa kéo']

const questionsToAsk = [
  'Tôi có được nghe thử đúng bộ loa sẽ mua không?',
  'Cấu hình này phù hợp phòng bao nhiêu m²? Có cần loa sub không?',
  'Bảo hành bao lâu cho từng thiết bị, bảo hành ở đâu?',
  'Giá đã gồm dây, phụ kiện, công lắp đặt và cân chỉnh chưa?',
  'Sau khi lắp, nếu bị hú hoặc cần chỉnh lại thì liên hệ thế nào?',
]

function buildFaqs(address: string, hours: string, phone: string) {
  return [
    {
      question: 'Mua loa karaoke ở đâu uy tín tại Quảng Ngãi?',
      answer: `Nên chọn nơi có showroom cố định, cho nghe thử trực tiếp, tư vấn theo diện tích phòng và hỗ trợ lắp đặt, cân chỉnh. Tiến Đạt Audio có showroom nghe thử tại ${address}, mở cửa ${hours}, hotline ${phone}.`,
    },
    {
      question: 'Nên mua dàn karaoke ở cửa hàng hay mua online?',
      answer: 'Mua online tiện so sánh giá, nhưng dàn karaoke cần nghe thử và cân chỉnh theo phòng. Nếu ở Quảng Ngãi, nên ghé cửa hàng để nghe thử, rồi so sánh báo giá chi tiết từng thiết bị trước khi quyết định.',
    },
    {
      question: 'Làm sao kiểm tra một cửa hàng âm thanh có uy tín?',
      answer: 'Đối chiếu địa chỉ trên website, fanpage và Google Maps; đọc đánh giá thật của khách; hỏi rõ model, xuất xứ, thời hạn bảo hành và chi phí lắp đặt; yêu cầu nghe thử trước khi mua.',
    },
    {
      question: 'Tiến Đạt Audio Quảng Ngãi có phải Tiến Đạt Audio ở Hà Nội không?',
      answer: `Không. Tiến Đạt Audio Quảng Ngãi là cửa hàng tại ${address}, hotline ${phone}, khác với Tiến Đạt Audio ở Phú Xuyên, Hà Nội.`,
    },
  ]
}

export const metadata: Metadata = generateSEOMetadata({
  pagePath,
  title: pageTitle,
  description: pageDescription,
  keywords: [
    'cửa hàng âm thanh uy tín Quảng Ngãi',
    'địa chỉ mua loa uy tín Quảng Ngãi',
    'mua loa karaoke ở đâu uy tín',
    'nên mua dàn karaoke ở đâu',
  ],
})

export const revalidate = 300

export default async function TrustedAudioStoreGuidePage() {
  const profile = await getBusinessProfile()
  const phoneHref = formatPhoneHref(profile.phone)
  const address = profile.address.formatted.replace(/, Việt Nam$/, '')
  const hours = profile.businessHours.join('; ')
  const faqs = buildFaqs(address, hours, profile.phone)
  const baseUrl = profile.siteUrl.replace(/\/$/, '')
  const pageUrl = absoluteSiteUrl(pagePath)
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: pageTitle,
        description: pageDescription,
        inLanguage: 'vi-VN',
        isPartOf: { '@id': `${baseUrl}#website` },
        about: { '@id': `${baseUrl}#business` },
        dateModified: profile.updatedAt,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: baseUrl },
          { '@type': 'ListItem', position: 2, name: 'Loa Quảng Ngãi', item: absoluteSiteUrl('/loa-quang-ngai') },
          { '@type': 'ListItem', position: 3, name: 'Chọn cửa hàng âm thanh uy tín', item: pageUrl },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${pageUrl}#faq`,
        mainEntity: faqs.map((faq) => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })),
      },
    ],
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pt-28 pb-20 md:pt-36">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-[#d32f2f] transition-colors">Trang chủ</Link>
          <ChevronRight size={14} className="text-slate-400" />
          <Link href="/loa-quang-ngai" className="hover:text-[#d32f2f] transition-colors">Loa Quảng Ngãi</Link>
          <ChevronRight size={14} className="text-slate-400" />
          <span className="font-semibold text-slate-700">Chọn cửa hàng âm thanh uy tín</span>
        </nav>

        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">Cách chọn cửa hàng âm thanh uy tín tại Quảng Ngãi</h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600">
          Dàn karaoke hay bộ loa nghe nhạc là khoản chi lớn và dùng nhiều năm. Dưới đây là 7 tiêu chí giúp bạn tự kiểm tra một cửa hàng âm thanh trước khi mua,
          kèm cách {profile.alternateName || profile.name} đáp ứng từng tiêu chí để bạn đối chiếu.
        </p>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">7 tiêu chí kiểm tra cửa hàng âm thanh</h2>
          {criteria.map((item, index) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">{index + 1}. {item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.detail}</p>
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                <span><strong>{profile.alternateName || profile.name}:</strong> {item.tienDat === 'showroom' ? `Showroom tại ${address}, mở cửa ${hours}.` : item.tienDat}</span>
              </p>
            </div>
          ))}
        </section>

        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Những gì {profile.alternateName || profile.name} không làm</h2>
          <p className="mt-2 text-sm text-slate-600">Để bạn tìm đúng nơi cho nhu cầu của mình, cửa hàng tập trung bán thiết bị, tư vấn phối ghép, lắp đặt và cân chỉnh hệ thống âm thanh.</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-3">
            {notOffered.map((item) => (
              <li key={item} className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700"><XCircle size={16} className="text-slate-400" /> {item}</li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-bold text-slate-900">5 câu nên hỏi trước khi chốt mua</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-6 text-sm leading-relaxed text-slate-700">
            {questionsToAsk.map((question) => <li key={question}>{question}</li>)}
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-bold text-slate-900">Câu hỏi thường gặp</h2>
          <div className="mt-4 space-y-3">
            {faqs.map((faq) => (
              <details key={faq.question} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-slate-900">
                  {faq.question}
                  <ChevronDown size={18} className="shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-2xl border-2 border-[#d32f2f] bg-white p-6 text-center">
          <h2 className="text-xl font-black text-slate-900">Ghé showroom {profile.alternateName || profile.name}</h2>
          <p className="mt-2 flex items-center justify-center gap-2 text-sm text-slate-600"><MapPin size={16} /> {address} · {hours}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <a href={phoneHref} className="inline-flex items-center gap-2 rounded-xl bg-[#d32f2f] px-5 py-3 text-sm font-bold text-white hover:bg-[#b71c1c]"><Phone size={16} /> Gọi {profile.phone}</a>
            <Link href="/loa-quang-ngai" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-800 hover:border-[#d32f2f]">Xem loa tại Quảng Ngãi <ArrowRight size={16} /></Link>
            <Link href="/combos" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-800 hover:border-[#d32f2f]">Dàn karaoke phối sẵn <ArrowRight size={16} /></Link>
          </div>
        </section>
      </div>
    </div>
  )
}
