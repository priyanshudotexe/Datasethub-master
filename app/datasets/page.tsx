"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import DatasetCard from "@/components/DatasetCard";
import { apiClient } from "@/lib/api";
import Link from "next/link";

interface Dataset {
  id: string;
  title: string;
  description: string;
  rating?: number;
  credibilityScore?: number;
}

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredDatasets, setFilteredDatasets] = useState<Dataset[]>([]);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getDatasets();
      setDatasets(response.data || []);
      setFilteredDatasets(response.data || []);
    } catch (error) {
      console.error("Error fetching datasets:", error);
      setDatasets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredDatasets(datasets);
    } else {
      const filtered = datasets.filter(
        (dataset) =>
          dataset.title.toLowerCase().includes(query.toLowerCase()) ||
          dataset.description.toLowerCase().includes(query.toLowerCase()),
      );
      setFilteredDatasets(filtered);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onSearch={handleSearch} searchValue={searchQuery} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Datasets</h1>
            <p className="text-gray-600 mt-2">
              Explore and contribute to machine learning datasets
            </p>
          </div>
          <Link
            href="/upload"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upload Dataset
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
              <p className="mt-4 text-gray-600">Loading datasets...</p>
            </div>
          </div>
        ) : filteredDatasets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {searchQuery
                ? "No datasets found matching your search."
                : "No datasets available yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDatasets.map((dataset) => (
              <DatasetCard
                key={dataset.id}
                id={dataset.id}
                title={dataset.title}
                description={dataset.description}
                rating={dataset.rating}
                credibilityScore={dataset.credibilityScore}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
