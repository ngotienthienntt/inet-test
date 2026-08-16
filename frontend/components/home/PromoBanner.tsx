import Image from 'next/image'
import Link from 'next/link'
import type { Banner, BannerPosition } from '@/lib/types'

async function fetchActiveBanner(position: BannerPosition): Promise<Banner | null> {
  try {
    const baseUrl = process.env.INTERNAL_API_URL || 'http://localhost:3001/api'
    const res = await fetch(`${baseUrl}/banners/active/${position}`, { next: { revalidate: 300 } })
    if (!res.ok) return null
    const data = await res.json()
    return data ?? null
  } catch {
    return null
  }
}

export default async function PromoBanner({ position }: { position: BannerPosition }) {
  const banner = await fetchActiveBanner(position)
  if (!banner) return null

  const image = (
    <Image
      src={banner.imageUrl}
      alt={banner.altText}
      width={1200}
      height={200}
      unoptimized
      className="w-full h-auto rounded-xl object-cover"
    />
  )

  return banner.linkUrl ? (
    <Link href={banner.linkUrl} className="block">
      {image}
    </Link>
  ) : (
    <div>{image}</div>
  )
}
