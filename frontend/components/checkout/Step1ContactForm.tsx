'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Info } from 'lucide-react'

export interface ContactFormData {
  fullName: string
  email: string
  phone: string
  address: string
  note: string
}

interface Step1ContactFormProps {
  onNext: (data: ContactFormData) => void
}

interface FieldErrors {
  fullName?: string
  email?: string
  phone?: string
  address?: string
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function Step1ContactForm({ onNext }: Step1ContactFormProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    note: '',
  })
  const [errors, setErrors] = useState<FieldErrors>({})

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof FieldErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  function validate(): boolean {
    const newErrors: FieldErrors = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ và tên'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email'
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Email không hợp lệ'
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại'
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Vui lòng nhập địa chỉ giao hàng'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (validate()) {
      onNext(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Guest checkout notice */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <span>Bạn đang thanh toán với tư cách khách. Không cần tạo tài khoản. </span>
          <Link href="/auth/login" className="font-semibold underline hover:text-blue-900">
            Đã có tài khoản? Đăng nhập
          </Link>
        </div>
      </div>

      {/* Full name */}
      <div className="flex flex-col gap-1">
        <label htmlFor="fullName" className="text-sm font-medium text-gray-700">
          Họ và tên <span className="text-red-500">*</span>
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="Nguyễn Văn A"
          className={`border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3762cc] focus:border-transparent transition-colors
            ${errors.fullName ? 'border-red-400 bg-red-50' : 'border-gray-300'}
          `}
        />
        {errors.fullName && (
          <p className="text-xs text-red-500">{errors.fullName}</p>
        )}
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-gray-700">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="example@email.com"
          className={`border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3762cc] focus:border-transparent transition-colors
            ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'}
          `}
        />
        {errors.email && (
          <p className="text-xs text-red-500">{errors.email}</p>
        )}
      </div>

      {/* Phone */}
      <div className="flex flex-col gap-1">
        <label htmlFor="phone" className="text-sm font-medium text-gray-700">
          Số điện thoại <span className="text-red-500">*</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          placeholder="0912 345 678"
          className={`border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3762cc] focus:border-transparent transition-colors
            ${errors.phone ? 'border-red-400 bg-red-50' : 'border-gray-300'}
          `}
        />
        {errors.phone && (
          <p className="text-xs text-red-500">{errors.phone}</p>
        )}
      </div>

      {/* Shipping address */}
      <div className="flex flex-col gap-1">
        <label htmlFor="address" className="text-sm font-medium text-gray-700">
          Địa chỉ giao hàng <span className="text-red-500">*</span>
        </label>
        <textarea
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
          rows={3}
          className={`border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3762cc] focus:border-transparent transition-colors resize-none
            ${errors.address ? 'border-red-400 bg-red-50' : 'border-gray-300'}
          `}
        />
        {errors.address && (
          <p className="text-xs text-red-500">{errors.address}</p>
        )}
      </div>

      {/* Note */}
      <div className="flex flex-col gap-1">
        <label htmlFor="note" className="text-sm font-medium text-gray-700">
          Ghi chú <span className="text-gray-400 font-normal">(tuỳ chọn)</span>
        </label>
        <textarea
          id="note"
          name="note"
          value={formData.note}
          onChange={handleChange}
          placeholder="Ghi chú thêm về đơn hàng, ví dụ: thời gian hay chỉ dẫn địa điểm giao hàng chi tiết hơn"
          rows={3}
          className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3762cc] focus:border-transparent resize-none transition-colors"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full py-3 text-sm font-semibold text-white bg-[#3762cc] hover:bg-[#2a4fa3] rounded-lg transition-colors"
      >
        Tiếp tục
      </button>
    </form>
  )
}
