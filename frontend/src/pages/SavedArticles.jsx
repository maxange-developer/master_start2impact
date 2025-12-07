/**
 * Saved Articles Page Component
 *
 * Displays user's bookmarked articles with quick navigation to full articles.
 *
 * Features:
 * - List of all user's saved articles
 * - Article preview cards with images
 * - Navigation to full article detail
 * - Empty state message
 * - Loading state
 * - Back navigation
 * - Hover animation on cards
 *
 * State:
 * - savedArticles: Array of SavedArticle objects (includes nested article)
 * - loading: Data fetch state
 *
 * Article Card:
 * - Left side: Article image (128x128px)
 * - Right side: Title, excerpt, category badge
 * - Click to navigate to /blog/{article_id}
 *
 * Image Priority:
 * - images array (first image)
 * - image_url
 * - image_slug
 *
 * API Endpoints:
 * - GET /blog/saved: Fetch user's bookmarked articles
 *
 * Technical Notes:
 * - Framer Motion for hover animations
 * - Responsive layout with horizontal card design
 * - Scrollable list with overflow handling
 * - Empty state with icon and helpful message
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { ArrowLeft, Bookmark, FileText } from "lucide-react";
import { motion } from "framer-motion";

export default function SavedArticles() {
  const navigate = useNavigate();
  const [savedArticles, setSavedArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedArticles();
  }, []);

  const fetchSavedArticles = async () => {
    try {
      const response = await api.get("/blog/saved");
      setSavedArticles(response.data);
    } catch (error) {
      console.error("Failed to fetch saved articles", error);
    } finally {
      setLoading(false);
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

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <header className="mb-4 flex-shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-400 hover:text-white transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-white flex-1 text-center">
            Articoli Salvati
          </h1>
          <div className="w-9"></div>
        </div>
        <p className="text-gray-400 text-center text-sm">I tuoi preferiti</p>
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      ) : savedArticles.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Bookmark className="w-12 h-12 text-gray-600 mb-4" />
          <p className="text-gray-400 mb-2">Nessun articolo salvato</p>
          <p className="text-sm text-gray-500">
            Salva gli articoli che ti interessano per trovarli qui!
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {savedArticles.map((saved) => (
            <motion.div
              key={saved.id}
              whileHover={{ x: 4 }}
              onClick={() => navigate(`/blog/${saved.article.id}`)}
              className="bg-white rounded-2xl overflow-hidden hover:shadow-2xl transition-shadow cursor-pointer flex h-28"
            >
              {/* Immagine a sinistra */}
              <div className="w-28 h-28 bg-gray-100 flex-shrink-0 overflow-hidden">
                {getImageUrl(saved.article) ? (
                  <img
                    src={getImageUrl(saved.article)}
                    alt={saved.article.title}
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

              {/* Contenuto a destra */}
              <div className="p-4 flex-1 flex flex-col justify-center">
                {saved.article.category && (
                  <span className="text-xs font-medium text-gray-500 mb-1">
                    {saved.article.category}
                  </span>
                )}
                <h3 className="text-sm font-semibold text-black line-clamp-2 mb-1">
                  {saved.article.title}
                </h3>
                <p className="text-gray-600 text-xs line-clamp-1">
                  {saved.article.excerpt ||
                    saved.article.content?.substring(0, 100) + "..."}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
