'use client'

import { useState } from 'react'

interface Spec {
  label: string
  value: string
}

interface ProductTabsProps {
  description: string
  specs: Spec[]
}

export default function ProductTabs({ description, specs }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<'description' | 'specs'>('description')

  return (
    <div className="mt-10">
      {/* Tab headers */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('description')}
          className={`px-6 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            activeTab === 'description'
              ? 'border-[#3762cc] text-[#3762cc]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Mô tả sản phẩm
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('specs')}
          className={`px-6 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            activeTab === 'specs'
              ? 'border-[#3762cc] text-[#3762cc]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Thông số kỹ thuật
        </button>
      </div>

      {/* Tab content */}
      <div className="py-6">
        {activeTab === 'description' && (
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
            <p>{description}</p>
          </div>
        )}

        {activeTab === 'specs' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {specs.map((spec, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-4 py-3 font-medium text-gray-600 w-1/3 border border-gray-200">
                      {spec.label}
                    </td>
                    <td className="px-4 py-3 text-gray-800 border border-gray-200">
                      {spec.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
