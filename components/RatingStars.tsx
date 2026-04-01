'use client'

import { Star } from 'lucide-react'

interface RatingStarsProps {
  rating: number
  onRate?: (rating: number) => void
  interactive?: boolean
}

export default function RatingStars({ rating, onRate, interactive = false }: RatingStarsProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => interactive && onRate?.(star)}
          disabled={!interactive}
          className={`${
            interactive
              ? 'cursor-pointer hover:scale-110 transition-transform'
              : 'cursor-default'
          }`}
        >
          <Star
            size={20}
            className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        </button>
      ))}
    </div>
  )
}
