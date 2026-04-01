"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { User } from "lucide-react";
import { clearAuthToken, isAuthenticated } from "@/lib/api";

interface NavbarProps {
  onSearch?: (query: string) => void;
  searchValue?: string;
}

export default function Navbar({ onSearch, searchValue }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(isAuthenticated());
  }, [pathname]);

  const handleLogout = () => {
    clearAuthToken();
    router.push("/login");
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch?.(e.target.value);
  };

  const showSearch = pathname === "/datasets";

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: App name */}
          <Link href="/datasets" className="text-2xl font-bold text-gray-900">
            DatasetHub
          </Link>

          {/* Center: Search bar (only on /datasets) */}
          {showSearch && (
            <div className="flex-1 max-w-md mx-auto">
              <input
                type="text"
                placeholder="Search datasets..."
                value={searchValue || ""}
                onChange={handleSearch}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Right: User profile icon */}
          <div className="flex items-center gap-4">
            {loggedIn ? (
              <>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-900 text-sm"
                >
                  Logout
                </button>
                <button
                  className="text-gray-600 hover:text-gray-900"
                  aria-label="User profile"
                >
                  <User size={24} />
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
