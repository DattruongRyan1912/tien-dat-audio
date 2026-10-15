import type { Product } from './data'

export interface SystemRole {
  categoryId: string
  role: string
  purpose: string
}

// Thứ tự các khối trong một dàn karaoke, từ nguồn tín hiệu tới loa.
export const karaokeSystemRoles: SystemRole[] = [
  { categoryId: 'vang-so', role: 'Vang số', purpose: 'Xử lý tiếng micro (echo, reverb), chống hú và chia tín hiệu cho loa full, loa sub.' },
  { categoryId: 'main-cong-suat', role: 'Main công suất (cục đẩy)', purpose: 'Khuếch đại tín hiệu từ vang số đủ lớn để kéo loa.' },
  { categoryId: 'loa-thung', role: 'Loa full (loa thùng)', purpose: 'Tái tạo giọng hát và phần lớn dải nhạc; là thiết bị quyết định chất âm của dàn.' },
  { categoryId: 'loa-tram', role: 'Loa sub (loa trầm)', purpose: 'Chỉ đảm nhận dải trầm sâu, giúp tiếng bass chắc và loa full đỡ tải.' },
]

// Chỉ hiển thị các thông số đã kiểm chứng theo đúng loại thiết bị. Dữ liệu vang số
// hiện đang lẫn thông số của loa sub nên không hiển thị thông số cho nhóm này.
const specWhitelist: Record<string, [key: string, label: string][]> = {
  'loa-thung': [
    ['power_handling', 'Công suất'],
    ['impedance', 'Trở kháng'],
    ['sensitivity', 'Độ nhạy'],
    ['frequency_response', 'Dải tần'],
  ],
  'loa-tram': [
    ['power_handling', 'Công suất'],
    ['impedance', 'Trở kháng'],
    ['frequency_response', 'Dải tần'],
  ],
  'main-cong-suat': [
    ['stereo_power_8ohm', 'Công suất mỗi kênh (8Ω)'],
    ['stereo_power_4ohm', 'Công suất mỗi kênh (4Ω)'],
    ['circuit_type', 'Mạch khuếch đại'],
  ],
}

export function getLandingSpecRows(product: Pick<Product, 'category_id' | 'specifications'>) {
  return (specWhitelist[product.category_id] || []).flatMap(([key, label]) => {
    const value = product.specifications[key]
    const text = Array.isArray(value) ? value.join(', ') : value
    return text ? [{ label, value: text }] : []
  })
}
