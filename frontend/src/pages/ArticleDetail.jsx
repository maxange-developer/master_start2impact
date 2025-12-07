/**
 * Article Detail Page Component
 *
 * Full article view with AI-structured content, image gallery, and bookmark functionality.
 *
 * Features:
 * - AI-structured content sections (intro, highlights, sections, tips, conclusion)
 * - Multi-image carousel with navigation
 * - Full-screen image modal
 * - Bookmark/unbookmark article
 * - Responsive layout with scrollable content
 * - Back navigation
 * - Loading state
 *
 * Content Structure (from structured_content JSON):
 * - intro: Opening paragraph
 * - highlights: Key points bullet list
 * - sections: Main content with titles and bodies
 * - tips: Practical advice cards
 * - conclusion: Closing paragraph
 *
 * State:
 * - article: Full article object with structured_content
 * - loading: Article fetch state
 * - isSaved: Bookmark status
 * - currentImageIndex: Active image in carousel (0-based)
 * - modalImageOpen: Full-screen image modal visibility
 *
 * Image Handling:
 * - Priority: images array > image_url > image_slug
 * - Carousel with left/right navigation
 * - Click to open full-screen modal
 * - Modal with X button and outside-click close
 *
 * API Endpoints:
 * - GET /blog/articles/{id}: Fetch article
 * - GET /blog/saved: Check if article bookmarked
 * - POST /blog/save/{id}: Bookmark article
 * - DELETE /blog/unsave/{id}: Unbookmark article
 *
 * Technical Notes:
 * - Lucide React icons
 * - Custom event 'articleSaved' for cross-component sync
 * - Overflow handling for long content
 * - Image index bounds checking
 */

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Lightbulb,
  Star,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

export default function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [modalImageOpen, setModalImageOpen] = useState(false);

  useEffect(() => {
    fetchArticle();
    checkIfSaved();
  }, [id]);

  const fetchArticle = async () => {
    try {
      const response = await api.get(`/blog/articles/${id}`);
      setArticle(response.data);
    } catch (error) {
      console.error("Failed to fetch article", error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfSaved = async () => {
    try {
      const response = await api.get("/blog/saved");
      const savedIds = response.data.map((item) => item.article_id);
      setIsSaved(savedIds.includes(parseInt(id)));
    } catch (error) {
      console.error("Failed to check saved status", error);
    }
  };

  const toggleSave = async () => {
    try {
      if (isSaved) {
        await api.delete(`/blog/unsave/${id}`);
        setIsSaved(false);
      } else {
        await api.post(`/blog/save/${id}`);
        setIsSaved(true);
      }
      window.dispatchEvent(new Event("articleSaved"));
    } catch (error) {
      console.error("Failed to toggle save article", error);
    }
  };
  const getImageUrl = () => {
    if (!article) return null;

    // Priority: images array > image_url > image_slug
    if (article.images && article.images.length > 0) {
      return `/images/blog/${article.images[currentImageIndex]}`;
    }
    if (article.image_url) return article.image_url;
    if (article.image_slug) return `/images/blog/${article.image_slug}.jpg`;
    return null;
  };

  const getImagesCount = () => {
    if (!article || !article.images) return 0;
    return article.images.length;
  };

  const goToPrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? getImagesCount() - 1 : prev - 1
    );
  };

  const goToNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === getImagesCount() - 1 ? 0 : prev + 1
    );
  };

  const openModal = () => {
    setModalImageOpen(true);
  };

  const closeModal = () => {
    setModalImageOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate("/blog")}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-white">Articolo non trovato</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Fixed header with back button, title and save */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-gray-400 hover:text-white transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h1
          className={`font-bold text-white flex-1 text-center leading-tight ${
            article.title.length > 60
              ? "text-lg sm:text-xl"
              : article.title.length > 40
              ? "text-xl sm:text-2xl"
              : "text-2xl sm:text-3xl"
          }`}
        >
          {article.title}
        </h1>

        <button
          onClick={toggleSave}
          className="p-2 text-gray-400 hover:text-white transition-colors flex-shrink-0"
        >
          {isSaved ? (
            <BookmarkCheck className="w-5 h-5 fill-current" />
          ) : (
            <Bookmark className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Image slideshow */}
          <div className="h-80 flex-shrink-0 bg-gray-100 relative group">
            {getImageUrl() ? (
              <>
                <img
                  src={getImageUrl()}
                  alt={article.title}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={openModal}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
                {/* Navigation arrows - only if there are multiple images */}
                {getImagesCount() > 1 && (
                  <>
                    <button
                      onClick={goToPrevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={goToNextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    {/* Indicators */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {article.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentImageIndex
                              ? "bg-white w-6"
                              : "bg-white/50 hover:bg-white/75"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full bg-gray-200"></div>
            )}
          </div>

          <div className="p-6">
            {/* Category badge */}
            {article.category && (
              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full mb-4">
                {article.category}
              </span>
            )}

            {/* Article content */}
            {article.structured_content ? (
              <StructuredContent structured={article.structured_content} />
            ) : (
              <FallbackContent content={article.content} />
            )}
          </div>
        </div>
      </div>

      {/* Full-screen image modal */}
      {modalImageOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeModal}
        >
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
          >
            <X className="w-8 h-8" />
          </button>

          <div className="relative w-full h-full flex items-center justify-center p-8">
            {getImageUrl() && (
              <>
                <img
                  src={getImageUrl()}
                  alt={article.title}
                  className="max-w-full max-h-full object-contain"
                  onClick={(e) => e.stopPropagation()}
                />

                {/* Navigation arrows in modal - only if there are multiple images */}
                {getImagesCount() > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        goToPrevImage();
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-colors"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        goToNextImage();
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-colors"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>

                    {/* Modal indicators */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                      {article.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImageIndex(index);
                          }}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            index === currentImageIndex
                              ? "bg-white w-8"
                              : "bg-white/50 hover:bg-white/75"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Structured content component
function StructuredContent({ structured }) {
  return (
    <div className="space-y-8">
      {/* Introduction */}
      {structured.intro?.text && (
        <div className="text-lg text-gray-800 leading-relaxed font-medium border-l-4 border-blue-500 pl-4 py-2">
          {structured.intro.text}
        </div>
      )}

      {/* Key highlights */}
      {structured.highlights && structured.highlights.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">Punti Chiave</h3>
          </div>
          <ul className="space-y-2">
            {structured.highlights.map((highlight, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <span className="text-blue-600 font-bold mt-0.5">•</span>
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Content sections */}
      {structured.sections &&
        structured.sections.map((section, index) => (
          <div key={index} className="space-y-3">
            <h3 className="text-xl font-bold text-gray-900 border-b-2 border-gray-200 pb-2">
              {section.title}
            </h3>
            {section.type === "quote" ? (
              <blockquote className="border-l-4 border-gray-300 pl-4 py-2 italic text-gray-700">
                {section.content}
              </blockquote>
            ) : section.type === "list" ? (
              <ul className="space-y-2 ml-4">
                {section.content
                  .split("\n")
                  .filter((l) => l.trim())
                  .map((item, i) => (
                    <li key={i} className="text-gray-700 list-disc">
                      {item}
                    </li>
                  ))}
              </ul>
            ) : (
              section.content.split("\n\n").map((paragraph, i) => (
                <p key={i} className="text-gray-700 leading-relaxed">
                  {paragraph}
                </p>
              ))
            )}
          </div>
        ))}

      {/* Practical tips */}
      {structured.tips && structured.tips.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 border-2 border-amber-200">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-bold text-gray-900">
              Consigli Pratici
            </h3>
          </div>
          <div className="space-y-4">
            {structured.tips.map((tip, index) => (
              <div key={index}>
                <h4 className="font-semibold text-gray-900 mb-1">
                  {tip.title}
                </h4>
                <p className="text-gray-700">{tip.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Article conclusion */}
      {structured.conclusion?.text && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-l-4 border-green-500">
          <p className="text-gray-800 leading-relaxed font-medium">
            {structured.conclusion.text}
          </p>
        </div>
      )}
    </div>
  );
}

// Fallback component for unstructured content
function FallbackContent({ content }) {
  return (
    <div className="prose prose-sm max-w-none text-gray-700">
      {content.split("\n").map((paragraph, index) => {
        if (paragraph.startsWith("### ")) {
          return (
            <h3 key={index} className="text-lg font-bold text-black mt-6 mb-3">
              {paragraph.replace("### ", "")}
            </h3>
          );
        }
        if (paragraph.startsWith("## ")) {
          return (
            <h2 key={index} className="text-xl font-bold text-black mt-8 mb-3">
              {paragraph.replace("## ", "")}
            </h2>
          );
        }
        if (paragraph.startsWith("**") && paragraph.endsWith("**")) {
          return (
            <p key={index} className="font-semibold text-black mt-4 mb-2">
              {paragraph.replace(/\*\*/g, "")}
            </p>
          );
        }
        if (paragraph.startsWith("- ")) {
          return (
            <li key={index} className="ml-4 text-gray-700 mb-1">
              {paragraph.replace("- ", "")}
            </li>
          );
        }
        if (paragraph.trim() === "---") {
          return <hr key={index} className="my-6 border-gray-200" />;
        }
        if (paragraph.trim() === "") {
          return null;
        }
        return (
          <p key={index} className="text-gray-700 mb-3 leading-relaxed">
            {paragraph}
          </p>
        );
      })}
    </div>
  );
}
