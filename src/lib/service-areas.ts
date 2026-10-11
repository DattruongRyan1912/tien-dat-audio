export interface ServiceAreaFAQ {
  question: string
  answer: string
}

export interface ServiceArea {
  slug: string
  name: string
  /** Tên tỉnh/thành trước sáp nhập 7/2025 và địa danh khách vẫn dùng khi tìm kiếm. */
  searchNames: string[]
  localities: string[]
  summary: string
  distance: string
  delivery: string
  installation: string
  projects: string[]
  faqs: ServiceAreaFAQ[]
  published: boolean
}

// Trang vùng chỉ được publish khi có dữ kiện thật của vùng đó (lịch giao, lắp đặt,
// công trình đã làm). Trang chỉ đổi tên tỉnh sẽ bị Google xem là doorway page.
export const serviceAreas: ServiceArea[] = [
  {
    slug: 'kon-tum',
    name: 'Kon Tum',
    searchNames: ['Kon Tum'],
    localities: [],
    summary: '',
    distance: '',
    delivery: '',
    installation: '',
    projects: [],
    faqs: [],
    published: false,
  },
  {
    slug: 'tam-ky-quang-nam',
    name: 'Tam Kỳ – Quảng Nam',
    searchNames: ['Tam Kỳ', 'Quảng Nam', 'Đà Nẵng'],
    localities: ['Tam Kỳ', 'Núi Thành', 'Hội An', 'Đà Nẵng'],
    summary: '',
    distance: '',
    delivery: '',
    installation: '',
    projects: [],
    faqs: [],
    published: false,
  },
  {
    slug: 'quy-nhon-binh-dinh',
    name: 'Quy Nhơn – Bình Định',
    searchNames: ['Quy Nhơn', 'Bình Định'],
    localities: ['Quy Nhơn', 'Hoài Nhơn'],
    summary: '',
    distance: '',
    delivery: '',
    installation: '',
    projects: [],
    faqs: [],
    published: false,
  },
  {
    slug: 'pleiku-gia-lai',
    name: 'Pleiku – Gia Lai',
    searchNames: ['Pleiku', 'Gia Lai'],
    localities: ['Pleiku'],
    summary: '',
    distance: '',
    delivery: '',
    installation: '',
    projects: [],
    faqs: [],
    published: false,
  },
]

export function isServiceAreaPublishable(area: ServiceArea) {
  return area.published
    && [area.summary, area.distance, area.delivery, area.installation].every((value) => value.trim().length > 0)
    && area.projects.length > 0
    && area.faqs.length >= 2
}

export function getPublishedServiceAreas(areas: ServiceArea[] = serviceAreas) {
  return areas.filter(isServiceAreaPublishable)
}

export function getPublishedServiceArea(slug: string, areas: ServiceArea[] = serviceAreas) {
  return getPublishedServiceAreas(areas).find((area) => area.slug === slug) || null
}
