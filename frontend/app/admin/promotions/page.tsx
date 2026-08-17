'use client'
import { useEffect, useRef, useState } from 'react'
import { ToastContainer } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import type { Banner, BannerPosition } from '@/lib/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('shopvn_token') || '' : '' }

const POSITION_LABELS: Record<BannerPosition, string> = {
  homepage_before_categories: 'Trang chủ – trước danh mục',
  shop_top: 'Trang danh mục – đầu trang',
}

const POSITION_OPTIONS = Object.keys(POSITION_LABELS) as BannerPosition[]

const EMPTY_FORM = {
  position: POSITION_OPTIONS[0],
  imageUrl: '',
  linkUrl: '',
  altText: '',
  isActive: true,
}

export default function AdminPromotionsPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Banner | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toasts, toast, close } = useToast()
  const [confirm, setConfirm] = useState<{ id: number; label: string } | null>(null)

  function load() {
    setLoading(true)
    fetch(`${API_URL}/banners`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(data => setBanners(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowForm(true)
  }

  function openEdit(banner: Banner) {
    setEditTarget(banner)
    setForm({
      position: banner.position,
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl ?? '',
      altText: banner.altText,
      isActive: banner.isActive,
    })
    setError('')
    setShowForm(true)
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', files[0])
      const res = await fetch(`${API_URL}/upload/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Upload thất bại')
      setForm(prev => ({ ...prev, imageUrl: data.url }))
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
      const body = {
        position: form.position,
        imageUrl: form.imageUrl,
        linkUrl: form.linkUrl || null,
        altText: form.altText,
        isActive: form.isActive,
      }
      const url = editTarget ? `${API_URL}/banners/${editTarget.id}` : `${API_URL}/banners`
      const method = editTarget ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message || 'Lỗi lưu banner'); return }
      setShowForm(false)
      toast(
        form.isActive
          ? `Đã lưu banner. Banner này thay thế banner đang bật trước đó ở vị trí "${POSITION_LABELS[form.position]}".`
          : (editTarget ? 'Đã cập nhật banner' : 'Đã thêm banner mới'),
        'success',
      )
      load()
    } catch { setError('Lỗi kết nối') } finally { setSaving(false) }
  }

  async function doDelete(id: number, label: string) {
    const res = await fetch(`${API_URL}/banners/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast(data.message || 'Không thể xóa banner', 'error')
      return
    }
    toast(`Đã xóa banner "${label}"`, 'success')
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1c3b71]">Khuyến mại</h1>
          <p className="text-sm text-gray-500 mt-1">{banners.length} banner</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 bg-[#3762cc] text-white rounded-lg text-sm font-semibold hover:bg-[#2a4fa3] transition-colors">
          + Thêm banner
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="font-bold text-lg text-[#1c3b71]">{editTarget ? 'Sửa banner' : 'Thêm banner'}</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí <span className="text-red-500">*</span></label>
              <select value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value as BannerPosition }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3762cc]">
                {POSITION_OPTIONS.map(pos => <option key={pos} value={pos}>{POSITION_LABELS[pos]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh <span className="text-red-500">*</span></label>
              {form.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.imageUrl} alt="" className="w-full h-24 object-cover rounded-lg mb-2 border border-gray-200" />
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={e => handleUpload(e.target.files)} className="text-sm" />
              {uploading && <p className="text-xs text-gray-400 mt-1">Đang tải ảnh...</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
              <input value={form.linkUrl} onChange={e => setForm(p => ({ ...p, linkUrl: e.target.value }))} placeholder="/shop?category=dien-thoai" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3762cc]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alt text <span className="text-red-500">*</span></label>
              <input value={form.altText} onChange={e => setForm(p => ({ ...p, altText: e.target.value }))} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3762cc]" />
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-sm font-medium text-gray-700">Kích hoạt</span>
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
              <button onClick={handleSave} disabled={saving || uploading || !form.imageUrl || !form.altText} className="flex-1 py-2.5 bg-[#3762cc] text-white rounded-lg font-semibold text-sm hover:bg-[#2a4fa3] disabled:opacity-60">
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
        ) : banners.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Chưa có banner nào</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {banners.map(banner => (
              <div key={banner.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={banner.imageUrl} alt="" className="w-20 h-12 object-cover rounded-lg border border-gray-200" />
                  <div>
                    <div className="font-medium text-gray-900">{POSITION_LABELS[banner.position] ?? banner.position}</div>
                    <div className="text-xs text-gray-400 font-mono">{banner.linkUrl || '(không có link)'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${banner.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {banner.isActive ? 'Đang bật' : 'Tắt'}
                  </span>
                  <button onClick={() => openEdit(banner)} className="text-[#3762cc] hover:underline text-sm">Sửa</button>
                  <span className="text-gray-200">|</span>
                  <button onClick={() => setConfirm({ id: banner.id, label: POSITION_LABELS[banner.position] ?? banner.position })} className="text-red-500 hover:underline text-sm">Xóa</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} onClose={close} />
      <ConfirmDialog
        open={confirm !== null}
        title="Xóa banner"
        message={`Bạn có chắc muốn xóa banner ở vị trí "${confirm?.label}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        onConfirm={() => { if (confirm) { doDelete(confirm.id, confirm.label); setConfirm(null) } }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
