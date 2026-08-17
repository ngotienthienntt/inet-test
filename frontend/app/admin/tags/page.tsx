'use client'
import { useEffect, useState } from 'react'
import { ToastContainer } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import type { Tag } from '@/lib/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('shopvn_token') || '' : '' }

const EMPTY_FORM = { name: '', slug: '' }

function slugify(str: string) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
}

export default function AdminTagsPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Tag | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { toasts, toast, close } = useToast()
  const [confirm, setConfirm] = useState<{ id: number; name: string } | null>(null)

  function load() {
    setLoading(true)
    fetch(`${API_URL}/tags`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(data => setTags(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowForm(true)
  }

  function openEdit(tag: Tag) {
    setEditTarget(tag)
    setForm({ name: tag.name, slug: tag.slug })
    setError('')
    setShowForm(true)
  }

  async function handleSave() {
    setError('')
    setSaving(true)
    try {
      const url = editTarget ? `${API_URL}/tags/${editTarget.id}` : `${API_URL}/tags`
      const method = editTarget ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message || 'Lỗi lưu tag'); return }
      setShowForm(false)
      toast(editTarget ? 'Đã cập nhật tag' : 'Đã thêm tag mới', 'success')
      load()
    } catch { setError('Lỗi kết nối') } finally { setSaving(false) }
  }

  async function doDelete(id: number, name: string) {
    const res = await fetch(`${API_URL}/tags/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast(data.message || 'Không thể xóa tag', 'error')
      return
    }
    toast(`Đã xóa tag "${name}"`, 'success')
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1c3b71]">Đối tượng sử dụng</h1>
          <p className="text-sm text-gray-500 mt-1">{tags.length} tag</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 bg-[#3762cc] text-white rounded-lg text-sm font-semibold hover:bg-[#2a4fa3] transition-colors">
          + Thêm tag
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="font-bold text-lg text-[#1c3b71]">{editTarget ? 'Sửa tag' : 'Thêm tag'}</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên <span className="text-red-500">*</span></label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value, slug: slugify(e.target.value) }))} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3762cc]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#3762cc]" />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={saving || !form.name} className="flex-1 py-2.5 bg-[#3762cc] text-white rounded-lg font-semibold text-sm hover:bg-[#2a4fa3] disabled:opacity-60">
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
        ) : tags.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Chưa có tag nào</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {tags.map(tag => (
              <div key={tag.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                <div>
                  <div className="font-medium text-gray-900">{tag.name}</div>
                  <div className="text-xs text-gray-400 font-mono">{tag.slug}</div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => openEdit(tag)} className="text-[#3762cc] hover:underline text-sm">Sửa</button>
                  <span className="text-gray-200">|</span>
                  <button onClick={() => setConfirm({ id: tag.id, name: tag.name })} className="text-red-500 hover:underline text-sm">Xóa</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} onClose={close} />
      <ConfirmDialog
        open={confirm !== null}
        title="Xóa tag"
        message={`Bạn có chắc muốn xóa tag "${confirm?.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        onConfirm={() => { if (confirm) { doDelete(confirm.id, confirm.name); setConfirm(null) } }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
