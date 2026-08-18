'use client'

interface Color {
  name: string
  hex: string
}

interface VariantSelectorProps {
  sizes: string[]
  colors: Color[]
  selectedSize: string
  selectedColor: string
  onSelectSize: (size: string) => void
  onSelectColor: (colorName: string) => void
}

export default function VariantSelector({
  sizes,
  colors,
  selectedSize,
  selectedColor,
  onSelectSize,
  onSelectColor,
}: VariantSelectorProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Size section */}
      {sizes.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Dung lượng / Kích thước</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onSelectSize(size)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  selectedSize === size
                    ? 'bg-[#3762cc] text-white border-[#3762cc]'
                    : 'border border-gray-300 text-gray-700 hover:border-[#3762cc]'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color section */}
      {colors.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Màu sắc</p>
          <div className="flex flex-wrap gap-3">
            {colors.map((color) => (
              <button
                key={color.name}
                type="button"
                title={color.name}
                onClick={() => onSelectColor(color.name)}
                className={`w-8 h-8 rounded-full border-2 border-white transition-all ${
                  selectedColor === color.name
                    ? 'ring-2 ring-offset-2 ring-[#3762cc]'
                    : 'hover:ring-2 hover:ring-offset-1 hover:ring-gray-300'
                }`}
                style={{ backgroundColor: color.hex }}
                aria-label={color.name}
              />
            ))}
          </div>
          {selectedColor && (
            <p className="text-xs text-gray-500 mt-1">Đã chọn: {selectedColor}</p>
          )}
        </div>
      )}
    </div>
  )
}
