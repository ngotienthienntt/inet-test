'use client'
import { useState, useEffect } from 'react'
import { adminFetch } from '@/lib/adminFetch'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

const SETTINGS_KEY = 'shopvn_admin_settings'

interface StoreSettings {
  storeName: string
  contactEmail: string
  contactPhone: string
  bankName: string
  bankAccount: string
  bankOwner: string
  freeShippingThreshold: string
}

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'ShopVN',
  contactEmail: 'support@shopvn.vn',
  contactPhone: '1900 1234',
  bankName: 'Vietcombank',
  bankAccount: '1234567890',
  bankOwner: 'CÔNG TY SHOPVN',
  freeShippingThreshold: '500000',
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS)
  const [settingsSaved, setSettingsSaved] = useState(false)

  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY)
      if (stored) setSettings(JSON.parse(stored))
    } catch {}
  }, [])

  function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 2000)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)
    if (passwords.newPass !== passwords.confirm) { setPwError('Mật khẩu mới không khớp'); return }
    if (passwords.newPass.length < 8) { setPwError('Mật khẩu phải có ít nhất 8 ký tự'); return }
    setPwSaving(true)
    try {
      const res = await adminFetch(`${API_URL}/auth/change-password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.newPass }),
      })
      if (res.ok) {
        setPwSuccess(true)
        setPasswords({ current: '', newPass: '', confirm: '' })
      } else {
        const data = await res.json()
        setPwError(data.message || 'Lỗi đổi mật khẩu')
      }
    } catch { setPwError('Lỗi kết nối') } finally { setPwSaving(false) }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1c3b71]">Cài đặt</h1>
        <p className="text-sm text-gray-500 mt-1">Quản lý cài đặt cửa hàng và tài khoản</p>
      </div>

      {/* Store settings */}
      <form onSubmit={handleSaveSettings} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Cài đặt cửa hàng</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên cửa hàng</label>
            <input
              value={settings.storeName}
              onChange={e => setSettings(p => ({ ...p, storeName: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3762cc]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email liên hệ</label>
            <input
              type="email"
              value={settings.contactEmail}
              onChange={e => setSettings(p => ({ ...p, contactEmail: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3762cc]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
            <input
              value={settings.contactPhone}
              onChange={e => setSettings(p => ({ ...p, contactPhone: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3762cc]"
            />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Thông tin ngân hàng (hiển thị khi thanh toán)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên ngân hàng</label>
              <input
                value={settings.bankName}
                onChange={e => setSettings(p => ({ ...p, bankName: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3762cc]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số tài khoản</label>
              <input
                value={settings.bankAccount}
                onChange={e => setSettings(p => ({ ...p, bankAccount: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#3762cc]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chủ tài khoản</label>
              <input
                value={settings.bankOwner}
                onChange={e => setSettings(p => ({ ...p, bankOwner: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3762cc]"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">Ngưỡng miễn phí vận chuyển (VND)</label>
          <input
            type="number"
            min="0"
            value={settings.freeShippingThreshold}
            onChange={e => setSettings(p => ({ ...p, freeShippingThreshold: e.target.value }))}
            className="w-48 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3762cc]"
          />
          <p className="text-xs text-gray-400 mt-1">Đơn hàng trên ngưỡng này sẽ được miễn phí vận chuyển</p>
        </div>

        <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#3762cc] text-white rounded-lg font-semibold text-sm hover:bg-[#2a4fa3] transition-colors"
          >
            Lưu cài đặt
          </button>
          {settingsSaved && <span className="text-sm text-green-600 font-medium">Đã lưu!</span>}
        </div>
      </form>

      {/* Change password */}
      <form onSubmit={handleChangePassword} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Đổi mật khẩu</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
          <input
            type="password"
            value={passwords.current}
            onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))}
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3762cc]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
          <input
            type="password"
            value={passwords.newPass}
            onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))}
            required
            minLength={8}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3762cc]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
          <input
            type="password"
            value={passwords.confirm}
            onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3762cc]"
          />
        </div>

        {pwError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{pwError}</p>}
        {pwSuccess && <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">Mật khẩu đã được cập nhật thành công!</p>}

        <button
          type="submit"
          disabled={pwSaving}
          className="px-6 py-2.5 bg-[#1c3b71] text-white rounded-lg font-semibold text-sm hover:bg-[#162e5a] disabled:opacity-60 transition-colors"
        >
          {pwSaving ? 'Đang lưu...' : 'Cập nhật mật khẩu'}
        </button>
      </form>
    </div>
  )
}
