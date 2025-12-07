/**
 * Blog Articles List Page Component
 *
 * Displays paginated blog articles with category filtering and bookmark functionality.
 *
 * Features:
 * - Paginated article grid (4 articles per page)
 * - Category filtering with multi-select
 * - Bookmark/unbookmark articles
 * - Saved article indicator
 * - Responsive article cards with images
 * - Navigation to article detail pages
 * - Real-time saved state sync via custom events
 *
 * State:
 * - articles: All blog articles array
 * - categories: Available category tags
 * - selectedCategories: Set of active filter categories
 * - savedIds: Set of user's bookmarked article IDs
 * - currentPage: Pagination index (0-based)
 *
 * Pagination:
 * - 4 articles per page (ITEMS_PER_PAGE)
 * - Left/right chevron navigation
 * - Circular navigation (wraps around)
 *
 * Event Listeners:
 * - 'articleSaved': Syncs saved state across components
 *
 * API Endpoints:
 * - GET /blog/articles: Fetch all articles
 * - GET /blog/categories: Fetch category list
 * - GET /blog/saved: Fetch user's saved articles
 * - POST /blog/save/{id}: Bookmark article
 * - DELETE /blog/unsave/{id}: Unbookmark article
 *
 * Technical Notes:
 * - Framer Motion for card animations
 * - Image fallback handling (images array, image_url, image_slug)
 * - Category filtering with Set for performance
 * - Custom event system for cross-component updates
 */

import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  Bookmark,
  BookmarkCheck,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/authStore";

const ITEMS_PER_PAGE = 4;

export default function Blog() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [savedIds, setSavedIds] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    fetchArticles();
    fetchCategories();
    fetchSavedArticles();

    // Event listener to update saved articles when changed from other pages
    const handleArticleSaved = (event) => {
      // Don't update if event comes from this same page
      if (event.detail?.source !== "blog") {
        fetchSavedArticles();
      }
    };
    window.addEventListener("articleSaved", handleArticleSaved);

    return () => {
      window.removeEventListener("articleSaved", handleArticleSaved);
    };
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await api.get("/blog/articles");
      setArticles(response.data);
    } catch (error) {
      console.error("Failed to fetch articles", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get("/blog/categories");
      setCategories(response.data);
    } catch (error) {
      console.error("Failed to fetch categories", error);
    }
  };

  const fetchSavedArticles = async () => {
    if (!user) {
      setSavedIds(new Set());
      return;
    }
    try {
      const response = await api.get("/blog/saved");
      const ids = new Set(
        response.data.map((item) => item.article_id || item.id)
      );
      setSavedIds(ids);
    } catch (error) {
      console.error("Failed to fetch saved articles", error);
      // If it fails (e.g., not authenticated), set empty Set
      setSavedIds(new Set());
    }
  };

  const toggleCategory = (category) => {
    setSelectedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
    setCurrentPage(0); // Reset to first page when filter changes
  };

  const toggleSave = async (articleId, e) => {
    e.stopPropagation();

    // Optimistically update local state immediately
    const wasSaved = savedIds.has(articleId);

    setSavedIds((prev) => {
      const newSet = new Set(prev);
      if (wasSaved) {
        newSet.delete(articleId);
      } else {
        newSet.add(articleId);
      }
      return newSet;
    });

    try {
      if (wasSaved) {
        await api.delete(`/blog/unsave/${articleId}`);
      } else {
        await api.post(`/blog/save/${articleId}`);
      }
      // Dispatch event to update counter in Navbar and Home (but not this page)
      window.dispatchEvent(
        new CustomEvent("articleSaved", { detail: { source: "blog" } })
      );
    } catch (error) {
      console.error("Failed to toggle save article", error);
      // Rollback on error
      setSavedIds((prev) => {
        const newSet = new Set(prev);
        if (wasSaved) {
          newSet.add(articleId);
        } else {
          newSet.delete(articleId);
        }
        return newSet;
      });
    }
  };

  const getImageUrl = (article) => {
    // Priority: images array > image_url > image_slug
    if (article.images && article.images.length > 0) {
      return `/images/blog/${article.images[0]}`;
    }
    if (article.image_url) return article.image_url;
    if (article.image_slug) return `/images/blog/${article.image_slug}.jpg`;
    return null;
  };

  // Filter articles by selected categories
  const filteredArticles =
    selectedCategories.size === 0
      ? articles
      : articles.filter((article) => selectedCategories.has(article.category));

  // Pagination logic
  const totalPages = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE);
  const paginatedArticles = filteredArticles.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <header className="mb-4 text-center flex-shrink-0">
        <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
          Blog Tenerife
        </h1>
        <p className="text-gray-400">Guide complete per il tuo viaggio</p>
      </header>

      {/* Category Chips */}
      {categories.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-4 flex-shrink-0">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => toggleCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                selectedCategories.has(category)
                  ? "bg-white text-black border-white"
                  : "bg-black text-white border-white hover:bg-gray-900"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {filteredArticles.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">Nessun articolo disponibile</p>
          <p className="text-sm text-gray-500">
            {selectedCategories.size > 0
              ? "Prova a selezionare altre categorie"
              : "Torna presto per nuovi contenuti!"}
          </p>
        </div>
      ) : (
        <>
          {/* 2x2 Article grid */}
          <div className="grid grid-cols-2 gap-4">
            {paginatedArticles.map((article) => (
              <motion.div
                key={article.id}
                whileHover={{ y: -4 }}
                onClick={() => navigate(`/blog/${article.id}`)}
                className="bg-white rounded-2xl overflow-hidden hover:shadow-2xl transition-shadow cursor-pointer h-[280px] flex flex-col"
              >
                <div className="h-32 bg-gray-100 overflow-hidden flex-shrink-0">
                  {getImageUrl(article) ? (
                    <img
                      src={getImageUrl(article)}
                      alt={article.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  {article.category && (
                    <span className="text-xs font-medium text-gray-500 mb-1 block">
                      {article.category}
                    </span>
                  )}
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-semibold text-black pr-2 line-clamp-2">
                      {article.title}
                    </h3>
                    <button
                      onClick={(e) => toggleSave(article.id, e)}
                      className="p-1 hover:bg-gray-100 rounded-full flex-shrink-0"
                    >
                      {savedIds.has(article.id) ? (
                        <BookmarkCheck className="w-4 h-4 text-black" />
                      ) : (
                        <Bookmark className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <p className="text-gray-600 text-xs line-clamp-2 flex-1">
                    {article.excerpt ||
                      article.content.substring(0, 100) + "..."}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Arrow navigation */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 0}
                className={`p-3 rounded-full border transition-all ${
                  currentPage === 0
                    ? "border-gray-700 text-gray-700 cursor-not-allowed"
                    : "border-white text-white hover:bg-white hover:text-black"
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <span className="text-white text-sm">
                {currentPage + 1} / {totalPages}
              </span>

              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages - 1}
                className={`p-3 rounded-full border transition-all ${
                  currentPage === totalPages - 1
                    ? "border-gray-700 text-gray-700 cursor-not-allowed"
                    : "border-white text-white hover:bg-white hover:text-black"
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
