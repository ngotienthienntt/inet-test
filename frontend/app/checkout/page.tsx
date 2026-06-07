'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import StepIndicator from '@/components/checkout/StepIndicator'
import Step1ContactForm, { ContactFormData } from '@/components/checkout/Step1ContactForm'
import Step2OrderReview from '@/components/checkout/Step2OrderReview'
import Step3BankInfo from '@/components/checkout/Step3BankInfo'

export interface CheckoutOrderResult {
  orderId: string
  orderNumber: string
  total: number
  bankAccount?: string
  bankName?: string
  accountHolder?: string
}

export default function CheckoutPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [contactData, setContactData] = useState<ContactFormData | null>(null)
  const [orderResult, setOrderResult] = useState<CheckoutOrderResult | null>(null)
  const { items } = useCart()
  const router = useRouter()

  useEffect(() => {
    if (items.length === 0 && step !== 3) {
      router.replace('/cart')
    }
  }, [items.length, step, router])

  function handleStep1Next(data: ContactFormData) {
    setContactData(data)
    setStep(2)
  }

  function handleStep2Back() {
    setStep(1)
  }

  function handleStep2Next(result: CheckoutOrderResult) {
    setOrderResult(result)
    setStep(3)
  }

  // While cart is empty and not on step 3, avoid rendering form on empty cart
  if (items.length === 0 && step !== 3) {
    return null
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Thanh toán</h1>
      <StepIndicator currentStep={step} />

      {step === 1 && (
        <Step1ContactForm onNext={handleStep1Next} />
      )}

      {step === 2 && contactData && (
        <Step2OrderReview
          contactData={contactData}
          onBack={handleStep2Back}
          onNext={handleStep2Next}
        />
      )}

      {step === 3 && (
        <Step3BankInfo orderResult={orderResult} />
      )}
    </div>
  )
}
