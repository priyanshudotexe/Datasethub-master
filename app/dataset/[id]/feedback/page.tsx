"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import RatingStars from "@/components/RatingStars";
import { apiClient, getAuthToken } from "@/lib/api";

export default function FeedbackPage() {
  const router = useRouter();
  const params = useParams();
  const datasetId = params.id as string;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!getAuthToken()) {
      router.push(`/login?next=/dataset/${datasetId}/feedback`);
      return;
    }

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    if (!comment.trim()) {
      setError("Please enter a comment");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await apiClient.postDatasetFeedback(datasetId, {
        rating,
        comment,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push(`/dataset/${datasetId}`);
      }, 2000);
    } catch (err) {
      setError("Failed to submit review. Please try again.");
      console.error("Error submitting feedback:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Submit Your Review
          </h1>
          <p className="text-gray-600 mb-8">
            Share your feedback about this dataset to help other users
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6">
              Review submitted successfully! Redirecting...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Rating
              </label>
              <div className="p-4 bg-gray-50 rounded-lg inline-block">
                <RatingStars
                  rating={rating}
                  onRate={setRating}
                  interactive={true}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {rating > 0 ? `You rated: ${rating}/5` : "Click to rate"}
              </p>
            </div>

            {/* Comment */}
            <div>
              <label
                htmlFor="comment"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Comment
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts about this dataset..."
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-600 mt-2">
                {comment.length}/500 characters
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 font-medium"
              >
                {loading ? "Submitting..." : "Submit Review"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="bg-gray-200 text-gray-900 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
