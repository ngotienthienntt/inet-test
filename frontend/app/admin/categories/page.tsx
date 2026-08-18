'use client'
import { useEffect, useRef, useState } from 'react'
import { ToastContainer } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { adminFetch } from '@/lib/adminFetch'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

interface Category {
  id: number
  name: string
  slug: string
  description?: string
  icon?: string
  isActive: boolean
  children?: Category[]
  parentId?: number | null
}

const EMPTY_FORM = { name: '', slug: '', description: '', icon: '', parentId: '', isActive: true }

function slugify(str: string) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const { toasts, toast, close } = useToast()
  const [confirm, setConfirm] = useState<{ id: number; name: string } | null>(null)

  function load() {
    setLoading(true)
    adminFetch(`${API_URL}/categories?all=true`)
      .then(r => r.json())
      .then(data => setCategories(Array.isArray(data) ? data : data?.data ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowForm(true)
  }

  function openEdit(cat: Category) {
    setEditTarget(cat)
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || '', icon: cat.icon || '', parentId: String(cat.parentId ?? ''), isActive: cat.isActive })
    setError('')
    setShowForm(true)
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', files[0])
      const res = await adminFetch(`${API_URL}/upload/image`, {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Upload thất bại')
      setForm(prev => ({ ...prev, icon: data.url }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload thất bại')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    setError('')
    setSaving(true)
    try {
      const body = { name: form.name, slug: form.slug, description: form.description || undefined, icon: form.icon || undefined, parentId: form.parentId ? Number(form.parentId) : null, isActive: form.isActive }
      const url = editTarget ? `${API_URL}/categories/${editTarget.id}` : `${API_URL}/categories`
      const method = editTarget ? 'PATCH' : 'POST'
      const res = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message || 'Lỗi lưu danh mục'); return }
      setShowForm(false)
      toast(editTarget ? 'Đã cập nhật danh mục' : 'Đã thêm danh mục mới', 'success')
      load()
    } catch { setError('Lỗi kết nối') } finally { setSaving(false) }
  }

  async function doDelete(id: number, name: string) {
    const res = await adminFetch(`${API_URL}/categories/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast(data.message || 'Không thể xóa danh mục', 'error')
      return
    }
    toast(`Đã xóa danh mục "${name}"`, 'success')
    load()
  }

  // Flatten tree for display
  function flattenCategories(cats: Category[], level = 0): { cat: Category; level: number }[] {
    const result: { cat: Category; level: number }[] = []
    for (const cat of cats) {
      result.push({ cat, level })
      if (cat.children?.length) result.push(...flattenCategories(cat.children, level + 1))
    }
    return result
  }

  const flat = flattenCategories(categories)
  const allFlat = categories.reduce<Category[]>((acc, c) => { acc.push(c); if (c.children) acc.push(...c.children); return acc }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1c3b71]">Danh mục</h1>
          <p className="text-sm text-gray-500 mt-1">{allFlat.length} danh mục</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 bg-[#3762cc] text-white rounded-lg text-sm font-semibold hover:bg-[#2a4fa3] transition-colors">
          + Thêm danh mục
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="font-bold text-lg text-[#1c3b71]">{editTarget ? 'Sửa danh mục' : 'Thêm danh mục'}</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên <span className="text-red-500">*</span></label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value, slug: slugify(e.target.value) }))} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3762cc]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={e => handleUpload(e.target.files)}
              />
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); if (!uploading) handleUpload(e.dataTransfer.files) }}
                className={`relative border-2 border-dashed border-gray-200 rounded-xl p-3 text-center transition-colors ${uploading ? 'cursor-wait opacity-70' : 'cursor-pointer hover:border-[#3762cc] hover:bg-blue-50/30'}`}
              >
                {uploading ? (
                  <div className="w-5 h-5 mx-auto border-2 border-[#3762cc] border-t-transparent rounded-full animate-spin" />
                ) : form.icon ? (
                  <div className="flex items-center justify-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.icon} alt="" className="w-10 h-10 object-contain" />
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setForm(p => ({ ...p, icon: '' })) }}
                      className="text-red-500 hover:underline text-xs"
                    >
                      Xóa
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">Kéo thả hoặc click để chọn ảnh icon</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#3762cc]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục cha</label>
              <select value={form.parentId} onChange={e => setForm(p => ({ ...p, parentId: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3762cc]">
                <option value="">-- Không có --</option>
                {allFlat.filter(c => !editTarget || c.id !== editTarget.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3762cc]" />
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
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={saving || uploading || !form.name} className="flex-1 py-2.5 bg-[#3762cc] text-white rounded-lg font-semibold text-sm hover:bg-[#2a4fa3] disabled:opacity-60">
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Hủy</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Đang tải...</div>
        ) : flat.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Chưa có danh mục nào</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {flat.map(({ cat, level }) => (
              <div key={cat.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center gap-3" style={{ paddingLeft: level * 24 }}>
                  {level > 0 && <span className="text-gray-300 text-sm">└</span>}
                  {cat.icon && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cat.icon} alt="" className="w-6 h-6 object-contain" />
                  )}
                  <div>
                    <div className="font-medium text-gray-900">{cat.name}</div>
                    <div className="text-xs text-gray-400 font-mono">{cat.slug}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {cat.isActive ? 'Hiển thị' : 'Ẩn'}
                  </span>
                  <button onClick={() => openEdit(cat)} className="text-[#3762cc] hover:underline text-sm">Sửa</button>
                  <span className="text-gray-200">|</span>
                  <button onClick={() => setConfirm({ id: cat.id, name: cat.name })} className="text-red-500 hover:underline text-sm">Xóa</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} onClose={close} />
      <ConfirmDialog
        open={confirm !== null}
        title="Xóa danh mục"
        message={`Bạn có chắc muốn xóa danh mục "${confirm?.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        onConfirm={() => { if (confirm) { doDelete(confirm.id, confirm.name); setConfirm(null) } }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
