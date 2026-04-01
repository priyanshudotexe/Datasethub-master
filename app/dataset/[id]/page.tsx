"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import RatingStars from "@/components/RatingStars";
import ReviewCard from "@/components/ReviewCard";
import { apiClient, getAuthToken } from "@/lib/api";
import axios from "axios";
import { Download, Sparkles } from "lucide-react";
import Link from "next/link";

interface Dataset {
  id: string;
  title: string;
  description: string;
  rating?: number | string | null;
  credibilityScore?: number;
  versionId?: string;
  latestVersionId?: string;
  versions?: Array<{ id: string }>;
  metadata?: Record<string, any>;
}

type MaybeId = string | number | null | undefined;

interface Review {
  id: string;
  rating: number;
  comment: string;
  author?: string;
  createdAt?: string;
}

export default function DatasetDetailPage() {
  const router = useRouter();
  const params = useParams();
  const datasetId = params.id as string;

  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccess, setAiSuccess] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  useEffect(() => {
    fetchDatasetDetails();
    fetchReviews();
  }, [datasetId]);

  const fetchDatasetDetails = async () => {
    try {
      const response = await apiClient.getDatasetById(datasetId);
      setDataset(response.data);
    } catch (error) {
      console.error("Error fetching dataset:", error);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getDatasetFeedback(datasetId);
      setReviews(response.data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    const toIdString = (value: MaybeId) => {
      if (value === null || value === undefined) return null;
      const normalized = String(value).trim();
      return normalized ? normalized : null;
    };

    const extractFilename = (contentDisposition?: string) => {
      if (!contentDisposition) return null;

      const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
      if (utf8Match?.[1]) {
        return decodeURIComponent(utf8Match[1].trim());
      }

      const asciiMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
      return asciiMatch?.[1]?.trim() || null;
    };

    try {
      setDownloadLoading(true);
      setDownloadError(null);

      const versionIds = [
        dataset?.latestVersionId,
        dataset?.versionId,
        dataset?.versions?.[0]?.id,
        dataset?.metadata?.version?.id,
        dataset?.metadata?.latestVersion?.id,
        dataset?.metadata?.latestVersionId,
        dataset?.metadata?.versionId,
      ]
        .map(toIdString)
        .filter((value): value is string => Boolean(value));

      if (versionIds.length === 0) {
        throw new Error("No dataset version ID available for download.");
      }

      let lastError: unknown = null;
      const attemptedPaths: string[] = [];

      for (const versionId of versionIds) {
        try {
          const path = `/versions/${versionId}/download`;
          attemptedPaths.push(path);
          const response = await apiClient.downloadVersion(versionId);
          const contentDisposition = response.headers["content-disposition"] as
            | string
            | undefined;
          const filename =
            extractFilename(contentDisposition) || `dataset-${datasetId}.csv`;

          const blobUrl = window.URL.createObjectURL(response.data);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(blobUrl);
          return;
        } catch (requestError) {
          lastError = requestError;
        }
      }

      if (axios.isAxiosError(lastError)) {
        const status = lastError.response?.status;
        const attempts =
          attemptedPaths.length > 0 ? attemptedPaths.join(", ") : "none";
        throw new Error(
          `Download route unavailable (status ${status ?? "unknown"}). Attempted: ${attempts}`,
        );
      }

      throw (
        lastError ||
        new Error("No valid download endpoint found for this dataset.")
      );
    } catch (error) {
      console.error("Error downloading dataset:", error);
      if (axios.isAxiosError(error)) {
        const serverMessage = (
          error.response?.data as { message?: string } | undefined
        )?.message;
        setDownloadError(
          serverMessage || "Failed to download dataset. Please try again.",
        );
      } else if (error instanceof Error) {
        setDownloadError(error.message);
      } else {
        setDownloadError("Failed to download dataset. Please try again.");
      }
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleGenerateDescription = async () => {
    const token = getAuthToken();
    if (!token) {
      router.push(`/login?next=/dataset/${datasetId}`);
      return;
    }

    try {
      setAiLoading(true);
      setAiError(null);
      setAiSuccess(null);
      setAiSummary(null);

      const response = await apiClient.suggestMetadata(datasetId);
      const responseData = response.data;

      const extractedSummary =
        responseData?.summary ??
        responseData?.aiSummary ??
        responseData?.description ??
        responseData?.generatedDescription ??
        responseData?.metadata?.summary ??
        responseData?.metadata?.aiSummary ??
        responseData?.suggestedMetadata?.summary ??
        responseData?.suggestedMetadata?.aiSummary ??
        responseData?.data?.summary ??
        responseData?.data?.aiSummary ??
        null;

      const suggestedMetadata =
        responseData?.metadata ??
        responseData?.suggestedMetadata ??
        responseData?.data?.metadata ??
        null;

      if (suggestedMetadata && typeof suggestedMetadata === "object") {
        setDataset((prev) => {
          if (!prev) return prev;

          return {
            ...prev,
            metadata: {
              ...(prev.metadata || {}),
              ...suggestedMetadata,
            },
          };
        });
      }

      if (typeof extractedSummary === "string" && extractedSummary.trim()) {
        const normalizedSummary = extractedSummary.trim();
        setAiSummary(normalizedSummary);

        setDataset((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            description: normalizedSummary,
          };
        });
      }

      setAiSuccess("AI description generated successfully.");
    } catch (error) {
      console.error("Error generating description:", error);
      if (axios.isAxiosError(error)) {
        const responseData = error.response?.data as
          | { message?: string; error?: string }
          | string
          | undefined;
        const serverMessage =
          typeof responseData === "string"
            ? responseData
            : responseData?.message || responseData?.error;

        if (serverMessage?.includes("ENOENT")) {
          setAiError(
            "AI metadata generation failed because the source CSV is missing on the backend server. Re-upload the dataset file (or fix backend file storage/path mapping) and try again.",
          );
        } else {
          setAiError(
            serverMessage ||
              "Failed to generate AI description. Please try again.",
          );
        }
      } else {
        setAiError("Failed to generate AI description. Please try again.");
      }
    } finally {
      setAiLoading(false);
    }
  };

  if (loading && !dataset) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-gray-600">Loading dataset...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <p className="text-center text-gray-600">Dataset not found</p>
        </div>
      </div>
    );
  }

  const normalizedRating = Number.isFinite(Number(dataset.rating))
    ? Number(dataset.rating)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Dataset Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {dataset.title}
          </h1>

          <div className="flex items-center gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">Average Rating</p>
              <div className="flex items-center gap-2">
                <RatingStars rating={Math.round(normalizedRating)} />
                <span className="text-lg font-semibold">
                  {normalizedRating.toFixed(1)}/5
                </span>
              </div>
            </div>

            {dataset.credibilityScore !== undefined && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Credibility Score</p>
                <p className="text-lg font-semibold text-blue-600">
                  {dataset.credibilityScore}%
                </p>
              </div>
            )}
          </div>

          <p className="text-gray-700 text-lg mb-6">{dataset.description}</p>

          {dataset.metadata && Object.keys(dataset.metadata).length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Metadata</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(dataset.metadata).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 uppercase tracking-wide">
                      {key}
                    </p>
                    <p className="text-gray-900 font-medium">{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={handleDownload}
              disabled={downloadLoading}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              <Download size={18} />
              {downloadLoading ? "Downloading..." : "Download Dataset"}
            </button>

            <button
              onClick={handleGenerateDescription}
              disabled={aiLoading}
              className="flex items-center gap-2 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400"
            >
              <Sparkles size={18} />
              {aiLoading ? "Generating..." : "Generate Description (AI)"}
            </button>

            <Link
              href={`/dataset/${datasetId}/feedback`}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Leave Review
            </Link>
          </div>

          {aiError && <p className="mt-4 text-sm text-red-600">{aiError}</p>}
          {downloadError && (
            <p className="mt-4 text-sm text-red-600">{downloadError}</p>
          )}
          {aiSuccess && (
            <p className="mt-4 text-sm text-green-600">{aiSuccess}</p>
          )}
          {aiSummary && (
            <div className="mt-4 rounded-lg border border-purple-200 bg-purple-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">
                AI Summary
              </p>
              <p className="mt-2 text-sm text-purple-900">{aiSummary}</p>
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Reviews</h2>

          {reviews.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              No reviews yet. Be the first to review!
            </p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  rating={review.rating}
                  comment={review.comment}
                  author={review.author}
                  createdAt={review.createdAt}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
