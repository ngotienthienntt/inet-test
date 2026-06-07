'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { searchApi } from '@/lib/api'

interface SearchSuggestion {
  id: number
  name: string
  category: string
  slug: string
}

interface SearchBarProps {
  className?: string
  placeholder?: string
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query) return <span>{text}</span>

  const index = text.toLowerCase().indexOf(query.toLowerCase())
  if (index === -1) return <span>{text}</span>

  return (
    <span>
      {text.slice(0, index)}
      <span className="font-bold">{text.slice(index, index + query.length)}</span>
      {text.slice(index + query.length)}
    </span>
  )
}

export default function SearchBar({
  className = '',
  placeholder = 'Tìm kiếm sản phẩm...',
}: SearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const filterSuggestions = useCallback((value: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)

    if (!value.trim()) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await searchApi.suggestions(value)
        const raw: unknown[] = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.suggestions)
          ? res.data.suggestions
          : []
        const mapped: SearchSuggestion[] = raw.slice(0, 6).map((item, idx) => {
          const s = item as Record<string, unknown>
          return {
            id: (s.id ?? idx) as number,
            name: (s.name ?? '') as string,
            category: (s.category ?? '') as string,
            slug: (s.slug ?? '') as string,
          }
        })
        setSuggestions(mapped)
      } catch {
        setSuggestions([])
      }
      setIsOpen(true)
      setHighlightedIndex(-1)
    }, 200)
  }, [])

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [])

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setQuery(value)
    filterSuggestions(value)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) {
      if (e.key === 'Enter' && query.trim()) {
        router.push(`/shop?q=${encodeURIComponent(query.trim())}`)
      }
      return
    }

    // Total items = suggestions + "see all" row
    const totalItems = suggestions.length + 1

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev + 1) % totalItems)
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev <= 0 ? totalItems - 1 : prev - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          const item = suggestions[highlightedIndex]
          router.push(`/products/${item.slug}`)
          setIsOpen(false)
          setQuery('')
        } else if (highlightedIndex === suggestions.length) {
          // "See all results" row
          router.push(`/shop?q=${encodeURIComponent(query.trim())}`)
          setIsOpen(false)
        } else {
          // No highlight — submit query
          if (query.trim()) {
            router.push(`/shop?q=${encodeURIComponent(query.trim())}`)
            setIsOpen(false)
          }
        }
        break
      case 'Escape':
        setIsOpen(false)
        setHighlightedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  function handleSubmit() {
    if (query.trim()) {
      router.push(`/shop?q=${encodeURIComponent(query.trim())}`)
      setIsOpen(false)
    }
  }

  function handleSuggestionClick(slug: string) {
    router.push(`/products/${slug}`)
    setIsOpen(false)
    setQuery('')
  }

  function handleSeeAllClick() {
    if (query.trim()) {
      router.push(`/shop?q=${encodeURIComponent(query.trim())}`)
      setIsOpen(false)
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="flex w-full">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 border-r-0 rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3762cc] focus:border-[#3762cc]"
            autoComplete="off"
          />
        </div>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-[#3762cc] hover:bg-[#2a4fa3] text-white rounded-r-lg transition-colors flex items-center gap-1 flex-shrink-0"
          aria-label="Tìm kiếm"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
          {suggestions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">Không tìm thấy kết quả</div>
          ) : (
            <>
              {suggestions.map((item, index) => (
                <button
                  key={item.id}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors ${
                    highlightedIndex === index ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleSuggestionClick(item.slug)
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <span className="text-gray-800">
                    <HighlightedText text={item.name} query={query} />
                  </span>
                  <span className="ml-3 flex-shrink-0 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {item.category}
                  </span>
                </button>
              ))}
              <button
                className={`w-full px-4 py-2.5 text-sm text-left border-t border-gray-100 transition-colors ${
                  highlightedIndex === suggestions.length
                    ? 'bg-blue-50 text-[#3762cc]'
                    : 'text-[#3762cc] hover:bg-gray-50'
                }`}
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleSeeAllClick()
                }}
                onMouseEnter={() => setHighlightedIndex(suggestions.length)}
              >
                Xem tất cả kết quả cho &apos;{query}&apos;
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
