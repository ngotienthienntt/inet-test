'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { adminFetch } from '@/lib/adminFetch'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
// Tạm thời ẩn Giá bán/Giá gốc — giá thật của sản phẩm lấy từ Biến thể.
const SHOW_BASE_PRICE_FIELDS = false

function slugify(str: string) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
}

function formatPrice(val: string) {
  const digits = val.replace(/\D/g, '')
  return digits ? Number(digits).toLocaleString('vi-VN') : ''
}

function parsePrice(val: string) { return val.replace(/\D/g, '') }

interface Category { id: number; name: string }
interface Tag { id: number; name: string; slug: string }

export default function EditProductPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [tagIds, setTagIds] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [slug, setSlug] = useState('')
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: '', slug: '', description: '', price: '', originalPrice: '',
    categoryId: '', badge: '', images: [] as string[], isActive: true,
  })
  const [specs, setSpecs] = useState<{ label: string; value: string }[]>([])
  const [variants, setVariants] = useState<{ size: string; colorName: string; colorHex: string; stock: string; price: string }[]>([])

  useEffect(() => {
    Promise.all([
      adminFetch(`${API_URL}/products/id/${params.id}`).then(r => r.json()),
      adminFetch(`${API_URL}/categories`).then(r => r.json()),
      adminFetch(`${API_URL}/tags`).then(r => r.json()),
    ]).then(([product, cats, tags]) => {
      setCategories(Array.isArray(cats) ? cats : cats?.data ?? [])
      setAllTags(Array.isArray(tags) ? tags : [])
      setTagIds(Array.isArray(product.tags) ? product.tags.map((t: { id: number }) => t.id) : [])
      setSlug(product.slug || '')

      // Price lives on the first variant, fall back to top-level price
      const firstVariant = Array.isArray(product.variants) ? product.variants[0] : undefined
      const price = String(firstVariant?.price ?? product.price ?? '')
      const originalPrice = String(firstVariant?.originalPrice ?? product.originalPrice ?? '')

      // categoryId is nested under category object
      const catId = String(product.category?.id ?? product.categoryId ?? '')

      // Images are objects { url, sortOrder } — extract URLs
      const images: string[] = Array.isArray(product.images)
        ? product.images.map((img: { url?: string } | string) =>
            typeof img === 'string' ? img : img?.url ?? ''
          ).filter(Boolean)
        : []

      setForm({
        name: product.name || '',
        slug: product.slug || '',
        description: product.description || '',
        price,
        originalPrice,
        categoryId: catId,
        badge: product.badge || '',
        images,
        isActive: product.isActive ?? true,
      })

      if (Array.isArray(product.specs)) setSpecs(product.specs)
      if (Array.isArray(product.variants)) {
        setVariants(product.variants.map((v: Record<string, unknown>) => ({
          size: String(v.size || ''),
          colorName: String(v.colorName || v.color_name || ''),
          colorHex: String(v.colorHex || v.color_hex || ''),
          stock: String(v.stock || ''),
          price: String(v.price || ''),
        })))
      }
    }).finally(() => setLoading(false))
  }, [params.id])

  function setField(key: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function toggleTag(id: number) {
    setTagIds(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    for (const file of Array.from(files)) {
      const idx = form.images.length
      setForm(prev => ({ ...prev, images: [...prev.images, ''] }))
      setUploadingIdx(idx)
      try {
        const fd = new FormData()
        fd.append('file', file)
        const res = await adminFetch(`${API_URL}/upload/image`, {
          method: 'POST',
          body: fd,
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Upload thất bại')
        setForm(prev => {
          const imgs = [...prev.images]
          imgs[idx] = data.url
          return { ...prev, images: imgs }
        })
      } catch (err) {
        setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))
        setError(err instanceof Error ? err.message : 'Upload thất bại')
      } finally {
        setUploadingIdx(null)
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const body = {
        name: form.name,
        slug: form.slug,
        description: form.description,
        price: Number(form.price),
        originalPrice: Number(form.originalPrice || form.price),
        categoryId: form.categoryId ? Number(form.categoryId) : undefined,
        badge: form.badge || undefined,
        images: form.images
          .filter(url => url.startsWith('http'))
          .map((url, i) => ({ url, sortOrder: i })),
        isActive: form.isActive,
        tagIds,
        specs: specs.filter(s => s.label && s.value),
        variants: variants.filter(v => v.stock).map(v => {
          const price = Number(v.price || form.price)
          return {
            size: v.size || undefined,
            colorName: v.colorName || undefined,
            colorHex: v.colorHex || undefined,
            stock: Number(v.stock),
            price,
            originalPrice: price,
          }
        }),
      }
      const res = await adminFetch(`${API_URL}/products/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message || 'Lỗi cập nhật'); return }
      router.push('/admin/products')
    } catch { setError('Lỗi kết nối') } finally { setSaving(false) }
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Đang tải...</div>

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1c3b71]">Sửa sản phẩm</h1>
          {slug && (
            <Link href={`/products/${slug}`} target="_blank" className="text-sm text-[#3762cc] hover:underline mt-1 inline-block">
              Xem trang sản phẩm →
            </Link>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Thông tin cơ bản</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value, slug: slugify(e.target.value) }))} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3762cc]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input value={form.slug} onChange={e => setField('slug', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#3762cc]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea value={form.description} onChange={e => setField('description', e.target.value)} rows={4} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3762cc]" />
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          {/* Giá bán / Giá gốc tạm thời ẩn — giá thật lấy từ Biến thể bên dưới.
              Bật lại bằng cách đổi SHOW_BASE_PRICE_FIELDS thành true. */}
          {SHOW_BASE_PRICE_FIELDS && (
            <>
              <h2 className="font-semibold text-gray-900">Giá bán</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatPrice(form.price)}
                    onChange={e => setField('price', parsePrice(e.target.value))}
                    required
                    placeholder="0"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3762cc]"
                  />
                  <p className="text-xs text-gray-400 mt-1">Chỉ áp dụng cho biến thể chưa nhập giá riêng — không ghi đè biến thể đã có giá</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá gốc</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatPrice(form.originalPrice)}
                    onChange={e => setField('originalPrice', parsePrice(e.target.value))}
                    placeholder="0"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3762cc]"
                  />
                </div>
              </div>
            </>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
              <select value={form.categoryId} onChange={e => setField('categoryId', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3762cc]">
                <option value="">-- Chọn danh mục --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Badge</label>
              <input value={form.badge} onChange={e => setField('badge', e.target.value)} placeholder="VD: HOT, NEW, SALE" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3762cc]" />
            </div>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm font-medium text-gray-700">Hiển thị (Kích hoạt)</span>
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? 'bg-[#3762cc]' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Hình ảnh</h2>
          {form.images.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {form.images.map((url, i) => (
                <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                  {url ? (
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 border-2 border-[#3762cc] border-t-transparent rounded-full animate-spin" />
                  )}
                  {url && (
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, images: p.images.filter((_, j) => j !== i) }))}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 leading-none"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={e => handleUpload(e.target.files)}
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleUpload(e.dataTransfer.files) }}
            className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-[#3762cc] hover:bg-blue-50/30 transition-colors"
          >
            <div className="text-3xl mb-2">📷</div>
            <p className="text-sm font-medium text-gray-700">Kéo thả hoặc click để chọn ảnh</p>
            <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP, GIF · Tối đa 5MB mỗi ảnh</p>
          </div>
        </div>

        {/* Variants */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-3">
          <h2 className="font-semibold text-gray-900">Biến thể</h2>
          {variants.length > 0 && (
            <div className="grid grid-cols-6 gap-2 px-0.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <span>Size</span>
              <span>Màu sắc</span>
              <span>Mã màu</span>
              <span>Tồn kho</span>
              <span>Giá</span>
              <span></span>
            </div>
          )}
          {variants.map((v, i) => (
            <div key={i} className="grid grid-cols-6 gap-2 items-center">
              <input placeholder="Size" value={v.size} onChange={e => { const vs = [...variants]; vs[i].size = e.target.value; setVariants(vs) }} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#3762cc]" />
              <input placeholder="Màu sắc" value={v.colorName} onChange={e => { const vs = [...variants]; vs[i].colorName = e.target.value; setVariants(vs) }} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#3762cc]" />
              <input placeholder="#hex" value={v.colorHex} onChange={e => { const vs = [...variants]; vs[i].colorHex = e.target.value; setVariants(vs) }} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#3762cc]" />
              <input type="number" placeholder="Tồn kho" value={v.stock} onChange={e => { const vs = [...variants]; vs[i].stock = e.target.value; setVariants(vs) }} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#3762cc]" />
              <input type="text" inputMode="numeric" placeholder="Giá (để trống = giá chung)" value={formatPrice(v.price)} onChange={e => { const vs = [...variants]; vs[i].price = parsePrice(e.target.value); setVariants(vs) }} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#3762cc]" />
              <button type="button" onClick={() => setVariants(vs => vs.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 text-xs">X</button>
            </div>
          ))}
          <button type="button" onClick={() => setVariants(vs => [...vs, { size: '', colorName: '', colorHex: '', stock: '', price: '' }])} className="text-[#3762cc] text-sm hover:underline">+ Thêm biến thể</button>
        </div>

        {/* Specs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-3">
          <h2 className="font-semibold text-gray-900">Thông số kỹ thuật</h2>
          {specs.map((s, i) => (
            <div key={i} className="grid grid-cols-3 gap-2 items-center">
              <input placeholder="Thông số" value={s.label} onChange={e => { const ss = [...specs]; ss[i].label = e.target.value; setSpecs(ss) }} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#3762cc]" />
              <input placeholder="Giá trị" value={s.value} onChange={e => { const ss = [...specs]; ss[i].value = e.target.value; setSpecs(ss) }} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#3762cc]" />
              <button type="button" onClick={() => setSpecs(ss => ss.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 text-xs w-fit">X</button>
            </div>
          ))}
          <button type="button" onClick={() => setSpecs(ss => [...ss, { label: '', value: '' }])} className="text-[#3762cc] text-sm hover:underline">+ Thêm thông số</button>
        </div>

        {/* Audience tags */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-3">
          <h2 className="font-semibold text-gray-900">Tag đối tượng sử dụng</h2>
          {allTags.length === 0 ? (
            <p className="text-sm text-gray-400">Chưa có tag nào — tạo ở trang Tag đối tượng sử dụng.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allTags.map(t => (
                <label key={t.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm cursor-pointer border ${tagIds.includes(t.id) ? 'bg-blue-50 border-[#3762cc] text-[#3762cc] font-medium' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                  <input type="checkbox" checked={tagIds.includes(t.id)} onChange={() => toggleTag(t.id)} className="accent-[#3762cc]" />
                  {t.name}
                </label>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={saving || uploadingIdx !== null} className="px-6 py-2.5 bg-[#3762cc] text-white rounded-lg font-semibold text-sm hover:bg-[#2a4fa3] disabled:opacity-60 transition-colors">
            {saving ? 'Đang lưu...' : uploadingIdx !== null ? 'Đang tải ảnh...' : 'Cập nhật'}
          </button>
          <button type="button" onClick={() => router.back()} className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Hủy</button>
        </div>
      </form>
    </div>
  )
}
