'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/adminFetch'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

interface Variant {
  id: number
  size?: string
  colorName?: string
  stock: number
  price: number
  product?: { name: string; id: number }
}

export default function InventoryPage() {
  const [variants, setVariants] = useState<Variant[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)
  const [edits, setEdits] = useState<Record<number, string>>({})

  useEffect(() => {
    adminFetch(`${API_URL}/products?limit=200`)
      .then(r => r.json())
      .then(data => {
        const products = Array.isArray(data) ? data : data?.products ?? data?.data ?? []
        const allVariants: Variant[] = []
        for (const p of products) {
          if (Array.isArray(p.variants)) {
            for (const v of p.variants) {
              allVariants.push({ ...v, product: { name: p.name, id: p.id } })
            }
          }
        }
        setVariants(allVariants)
      })
      .finally(() => setLoading(false))
  }, [])

  async function saveStock(variantId: number) {
    const newStock = Number(edits[variantId])
    if (isNaN(newStock) || newStock < 0) return
    setSaving(variantId)
    try {
      await adminFetch(`${API_URL}/products/variants/${variantId}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock }),
      })
      setVariants(prev => prev.map(v => v.id === variantId ? { ...v, stock: newStock } : v))
      setEdits(prev => { const e = { ...prev }; delete e[variantId]; return e })
    } finally { setSaving(null) }
  }

  const lowStock = variants.filter(v => v.stock > 0 && v.stock < 5)
  const outOfStock = variants.filter(v => v.stock === 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1c3b71]">Kho hàng</h1>
        <p className="text-sm text-gray-500 mt-1">Quản lý tồn kho theo biến thể</p>
      </div>

      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <div className="flex gap-4 flex-wrap">
          {outOfStock.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-medium">
              {outOfStock.length} biến thể hết hàng
            </div>
          )}
          {lowStock.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-700 font-medium">
              {lowStock.length} biến thể sắp hết hàng (&lt;5)
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Đang tải...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase tracking-wide bg-gray-50">
                  <th className="px-6 py-3 font-medium">Sản phẩm</th>
                  <th className="px-6 py-3 font-medium">Size / Màu</th>
                  <th className="px-6 py-3 font-medium">Tồn kho</th>
                  <th className="px-6 py-3 font-medium">Cập nhật</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {variants.map(v => {
                  const isLow = v.stock > 0 && v.stock < 5
                  const isOut = v.stock === 0
                  return (
                    <tr key={v.id} className={`hover:bg-gray-50 ${isOut ? 'bg-red-50/30' : isLow ? 'bg-yellow-50/30' : ''}`}>
                      <td className="px-6 py-4 font-medium text-gray-900">{v.product?.name}</td>
                      <td className="px-6 py-4 text-gray-600">{[v.size, v.colorName].filter(Boolean).join(' / ') || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`font-semibold ${isOut ? 'text-red-600' : isLow ? 'text-yellow-600' : 'text-gray-900'}`}>{v.stock}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={edits[v.id] ?? ''}
                            onChange={e => setEdits(prev => ({ ...prev, [v.id]: e.target.value }))}
                            placeholder="Nhập tồn kho mới"
                            className="w-36 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#3762cc]"
                          />
                          {edits[v.id] !== undefined && (
                            <button
                              onClick={() => saveStock(v.id)}
                              disabled={saving === v.id}
                              className="px-3 py-1 bg-[#3762cc] text-white rounded-lg text-xs font-medium hover:bg-[#2a4fa3] disabled:opacity-60"
                            >
                              {saving === v.id ? '...' : 'Lưu'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
