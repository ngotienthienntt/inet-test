'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import FormField from '@/components/ui/FormField'
import { useAuth } from '@/context/AuthContext'

interface FormErrors {
  fullName?: string
  email?: string
  phone?: string
  password?: string
  confirmPassword?: string
  terms?: string
  general?: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()
  const [success, setSuccess] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)

  function validate(): boolean {
    const newErrors: FormErrors = {}

    if (!fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ và tên'
    }

    if (!email.trim()) {
      newErrors.email = 'Vui lòng nhập email'
    } else if (!EMAIL_REGEX.test(email)) {
      newErrors.email = 'Email không hợp lệ'
    }

    if (!phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại'
    }

    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu'
    } else if (password.length < 8) {
      newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự'
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu'
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'
    }

    if (!termsAccepted) {
      newErrors.terms = 'Bạn phải đồng ý với điều khoản để tiếp tục'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      await register({ fullName, email, phone, password })
      setSuccess(true)
    } catch {
      setErrors((prev) => ({ ...prev, general: 'Đăng ký thất bại. Vui lòng thử lại.' }))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!success) return
    const timer = setTimeout(() => router.push('/auth/login'), 3000)
    return () => clearTimeout(timer)
  }, [success, router])

  const inputClass = (hasError: boolean) =>
    `w-full px-3 py-2 border rounded-lg text-sm outline-none transition focus:ring-2 focus:ring-[#3762cc]/30 ${
      hasError
        ? 'border-red-500 focus:border-red-500'
        : 'border-gray-300 focus:border-[#3762cc]'
    }`

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8 flex flex-col items-center gap-4 text-center">
          <CheckCircle className="w-16 h-16 text-green-500" />
          <h1 className="text-2xl font-bold text-gray-900">Đăng ký thành công!</h1>
          <p className="text-gray-500 text-sm">Tài khoản của bạn đã được tạo. Đang chuyển đến trang đăng nhập...</p>
          <Link href="/auth/login" className="mt-2 text-sm text-[#3762cc] font-medium hover:underline">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Link href="/" className="text-2xl font-bold text-[#3762cc]">
            ShopVN
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">
          Tạo tài khoản
        </h1>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {/* General error */}
          {errors.general && (
            <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              {errors.general}
            </div>
          )}

          {/* Full name */}
          <FormField label="Họ và tên" error={errors.fullName} required>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className={inputClass(!!errors.fullName)}
            />
          </FormField>

          {/* Email */}
          <FormField label="Email" error={errors.email} required>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClass(!!errors.email)}
            />
          </FormField>

          {/* Phone */}
          <FormField label="Số điện thoại" error={errors.phone} required>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0901 234 567"
              className={inputClass(!!errors.phone)}
            />
          </FormField>

          {/* Password */}
          <FormField label="Mật khẩu" error={errors.password} required>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 8 ký tự"
                className={inputClass(!!errors.password) + ' pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </FormField>

          {/* Confirm password */}
          <FormField label="Xác nhận mật khẩu" error={errors.confirmPassword} required>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                className={inputClass(!!errors.confirmPassword) + ' pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </FormField>

          {/* Terms checkbox */}
          <div className="flex flex-col gap-1">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#3762cc] cursor-pointer"
              />
              <span className="text-sm text-gray-600">
                Tôi đồng ý với{' '}
                <Link href="#" className="text-[#3762cc] hover:underline">
                  Điều khoản sử dụng
                </Link>{' '}
                và{' '}
                <Link href="#" className="text-[#3762cc] hover:underline">
                  Chính sách bảo mật
                </Link>
              </span>
            </label>
            {errors.terms && (
              <p className="text-xs text-red-500 mt-0.5">{errors.terms}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#3762cc] hover:bg-[#2d52b0] disabled:opacity-70 text-white font-semibold py-2.5 rounded-lg transition mt-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Tạo tài khoản
          </button>
        </form>

        {/* Login link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Đã có tài khoản?{' '}
          <Link href="/auth/login" className="text-[#3762cc] font-medium hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  )
}
