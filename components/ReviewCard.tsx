'use client'

import RatingStars from './RatingStars'

interface ReviewCardProps {
  rating: number
  comment: string
  author?: string
  createdAt?: string
}

export default function ReviewCard({
  rating,
  comment,
  author = 'Anonymous',
  createdAt,
}: ReviewCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-medium text-gray-900">{author}</p>
          {createdAt && <p className="text-xs text-gray-500">{createdAt}</p>}
        </div>
        <RatingStars rating={rating} />
      </div>
      <p className="text-gray-700 text-sm">{comment}</p>
    </div>
  )
}
