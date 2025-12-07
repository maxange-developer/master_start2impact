/**
 * Navbar Component - Application Navigation Bar
 *
 * Fixed navigation bar with route links, user profile dropdown,
 * and real-time saved articles counter.
 *
 * Key Features:
 * - Active route highlighting
 * - User profile dropdown with logout
 * - Saved articles badge counter
 * - Multi-language support
 * - Admin-only "Create Article" button
 * - Outside-click dropdown closing
 *
 * State Management:
 * - isProfileOpen: Profile dropdown visibility
 * - savedCount: Number of user's saved articles
 *
 * Event Listeners:
 * - 'articleSaved' custom event for counter updates
 * - 'mousedown' for outside-click detection
 *
 * Technical Notes:
 * - Fixed positioning (z-50) ensures always on top
 * - Fetches saved count on mount and after saves
 * - Uses Lucide React icons
 * - Backdrop blur effect for glassmorphism
 */

import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Search,
  BookOpen,
  User,
  LogOut,
  Bookmark,
  Edit2,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useLanguage } from "../i18n/LanguageContext";
import LanguageSelector from "../i18n/LanguageSelector";
import api from "../services/api";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { t } = useLanguage();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const profileRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchSavedCount();
    }
  }, [user]);

  // Listen for saved article updates
  useEffect(() => {
    const handleSavedUpdate = () => {
      fetchSavedCount();
    };
    window.addEventListener("articleSaved", handleSavedUpdate);
    return () => window.removeEventListener("articleSaved", handleSavedUpdate);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileOpen]);

  /**
   * Fetch saved articles count from API
   * Updates badge counter in Navbar
   */
  const fetchSavedCount = async () => {
    if (!user) return;
    try {
      const response = await api.get("/blog/saved");
      setSavedCount(response.data.length);
    } catch (error) {
      console.error("Failed to fetch saved count", error);
    }
  };

  /**
   * Check if current route matches path
   * @param {string} path - Route path to compare
   * @returns {boolean} True if current location matches path
   */
  const isActive = (path) => location.pathname === path;

  /**
   * Handle user logout action
   * Clears auth state and redirects to landing
   */
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  /**
   * Close profile dropdown when navigating
   */
  const handleNavClick = () => {
    setIsProfileOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-b border-gray-800 z-50">
      <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          to="/home"
          onClick={handleNavClick}
          className="font-semibold text-lg text-white tracking-tight font-mono"
        >
          TENERIFE <span className="font-bold text-xl">AI</span>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            to="/home"
            onClick={handleNavClick}
            className={`p-2.5 rounded-full ${
              isActive("/home")
                ? "bg-white text-black"
                : "text-gray-400 hover:bg-gray-800"
            }`}
          >
            <Home className="w-5 h-5" strokeWidth={1.5} />
          </Link>
          <Link
            to="/search"
            onClick={handleNavClick}
            className={`p-2.5 rounded-full ${
              isActive("/search")
                ? "bg-white text-black"
                : "text-gray-400 hover:bg-gray-800"
            }`}
          >
            <Search className="w-5 h-5" strokeWidth={1.5} />
          </Link>
          <Link
            to="/blog"
            onClick={handleNavClick}
            className={`p-2.5 rounded-full ${
              isActive("/blog")
                ? "bg-white text-black"
                : "text-gray-400 hover:bg-gray-800"
            }`}
          >
            <BookOpen className="w-5 h-5" strokeWidth={1.5} />
          </Link>

          {/* Language Selector */}
          <div className="ml-2" onMouseEnter={() => setIsProfileOpen(false)}>
            <LanguageSelector variant="navbar" />
          </div>

          <div className="relative ml-2" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={`p-2.5 rounded-full ${
                isProfileOpen
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:bg-gray-800"
              }`}
            >
              <User className="w-5 h-5" strokeWidth={1.5} />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                <div className="p-5 bg-gray-100">
                  <p className="font-semibold text-black">{user?.full_name}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
                <div className="p-2">
                  {user?.is_admin && (
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate("/create-article");
                      }}
                      className="w-full flex items-center gap-3 text-black hover:bg-gray-100 p-3 rounded-xl mb-1"
                    >
                      <Edit2 className="w-4 h-4" strokeWidth={1.5} />
                      {t("nav.create")}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate("/saved");
                    }}
                    className="w-full flex items-center justify-between text-black hover:bg-gray-100 p-3 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <Bookmark className="w-4 h-4" strokeWidth={1.5} />
                      {t("nav.saved")}
                    </div>
                    <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-xs font-semibold flex items-center justify-center">
                      {savedCount}
                    </span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 text-red-600 hover:bg-red-50 p-3 rounded-xl"
                  >
                    <LogOut className="w-4 h-4" strokeWidth={1.5} />
                    {t("nav.logout")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
