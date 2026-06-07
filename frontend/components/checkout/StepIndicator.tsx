import { Check } from 'lucide-react'

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3
}

const STEPS = [
  { number: 1, label: 'Thông tin' },
  { number: 2, label: 'Xem lại đơn hàng' },
  { number: 3, label: 'Thanh toán' },
]

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center w-full mb-8">
      {STEPS.map((step, index) => {
        const isCompleted = step.number < currentStep
        const isCurrent = step.number === currentStep
        const isUpcoming = step.number > currentStep
        const isLast = index === STEPS.length - 1

        return (
          <div key={step.number} className="flex items-center flex-1 last:flex-none">
            {/* Step circle + label */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm transition-colors
                  ${isCompleted ? 'bg-[#3762cc] text-white' : ''}
                  ${isCurrent ? 'bg-[#3762cc] text-white' : ''}
                  ${isUpcoming ? 'bg-gray-200 text-gray-500' : ''}
                `}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" strokeWidth={2.5} />
                ) : (
                  <span>{step.number}</span>
                )}
              </div>
              <span
                className={`text-xs whitespace-nowrap
                  ${isCurrent ? 'font-bold text-[#3762cc]' : ''}
                  ${isCompleted ? 'text-[#3762cc]' : ''}
                  ${isUpcoming ? 'text-gray-400' : ''}
                `}
              >
                {step.label}
              </span>
            </div>

            {/* Connecting line */}
            {!isLast && (
              <div
                className={`h-0.5 flex-1 mx-2 mb-4 transition-colors
                  ${isCompleted ? 'bg-[#3762cc]' : 'bg-gray-200'}
                `}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
