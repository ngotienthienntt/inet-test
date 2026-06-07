'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import FormField from '@/components/ui/FormField'
import { useAuth } from '@/context/AuthContext'

interface FormErrors {
  email?: string
  password?: string
  general?: string
}

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)

  function validate(): boolean {
    const newErrors: FormErrors = {}
    if (!email.trim()) {
      newErrors.email = 'Vui lòng nhập email'
    }
    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      await login(email, password)
    } catch {
      setErrors({ general: 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.' })
    } finally {
      setLoading(false)
    }
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
          Đăng nhập
        </h1>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {/* General error */}
          {errors.general && (
            <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              {errors.general}
            </div>
          )}

          {/* Email */}
          <FormField label="Email" error={errors.email} required>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition focus:ring-2 focus:ring-[#3762cc]/30 ${
                errors.email
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:border-[#3762cc]'
              }`}
            />
          </FormField>

          {/* Password with inline "Quên mật khẩu?" */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Mật khẩu <span className="text-red-500">*</span>
              </span>
              <Link
                href="#"
                className="text-xs text-[#3762cc] hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full px-3 py-2 pr-10 border rounded-lg text-sm outline-none transition focus:ring-2 focus:ring-[#3762cc]/30 ${
                  errors.password
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:border-[#3762cc]'
                }`}
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
            {errors.password && (
              <p className="text-xs text-red-500 mt-0.5">{errors.password}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#3762cc] hover:bg-[#2d52b0] disabled:opacity-70 text-white font-semibold py-2.5 rounded-lg transition mt-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Đăng nhập
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-400">hoặc</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Google login */}
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <path
              d="M43.611 20.083H42V20H24v8h11.303C33.977 32.244 29.419 35 24 35c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
              fill="#FFC107"
            />
            <path
              d="M6.306 14.691l6.571 4.819C14.655 16.108 19.001 13 24 13c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
              fill="#FF3D00"
            />
            <path
              d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 35c-5.402 0-9.956-3.405-11.412-8.102L6.196 32.27C9.505 39.205 16.227 44 24 44z"
              fill="#4CAF50"
            />
            <path
              d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
              fill="#1976D2"
            />
          </svg>
          Đăng nhập với Google
        </button>

        {/* Register link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Chưa có tài khoản?{' '}
          <Link href="/auth/register" className="text-[#3762cc] font-medium hover:underline">
            Đăng ký
          </Link>
        </p>
      </div>
    </div>
  )
}
