interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingClasses: Record<NonNullable<CardProps['padding']>, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-8',
}

export default function Card({
  children,
  className = '',
  padding = 'md',
}: CardProps) {
  const classes = [
    'bg-white rounded-xl shadow-sm border border-gray-100',
    paddingClasses[padding],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <div className={classes}>{children}</div>
}
