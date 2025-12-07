/**
 * AI Search Page Component
 *
 * Intelligent activity search powered by OpenAI and Tavily APIs.
 * Provides natural language query processing with Tenerife-specific results.
 *
 * Features:
 * - Natural language search input with expansion animation
 * - AI-powered activity discovery
 * - Multi-language support (ES, EN, IT, DE, FR)
 * - Predefined suggestion chips
 * - Off-topic query detection
 * - Activity detail modal with pricing, location, ratings
 * - External booking links
 * - Loading states with spinner
 * - Reset functionality
 *
 * State:
 * - query: User search text
 * - results: Array of ActivityResult objects
 * - loading: Search in progress state
 * - searched: Whether search has been performed
 * - selectedActivity: Currently viewed activity in modal
 * - isInputExpanded: Search bar expansion state
 * - offTopicMessage: Error message for non-Tenerife queries
 * - isSuggestion: Whether query came from suggestion chip
 *
 * API Integration:
 * - POST /search/ with query, is_suggestion, language
 * - Returns SearchResponse with results or off_topic flag
 *
 * Technical Notes:
 * - Framer Motion for animations
 * - Lucide React icons
 * - Suggestion chips trigger is_suggestion=true
 * - Modal prevents body scroll
 * - Input auto-focus on expansion
 */

import React, { useState, useRef, useEffect } from "react";
import api from "../services/api";
import {
  Search,
  ExternalLink,
  MapPin,
  X,
  Clock,
  Star,
  Tag,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../i18n/LanguageContext";

export default function AISearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const [offTopicMessage, setOffTopicMessage] = useState(null);
  const [isSuggestion, setIsSuggestion] = useState(false);
  const inputRef = useRef(null);
  const { t, language } = useLanguage();

  useEffect(() => {
    if (isInputExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isInputExpanded]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    setResults([]); // Clear previous results
    setOffTopicMessage(null); // Clear previous off-topic message

    // Get current language suggestions
    const suggestions = t("aiSearch.suggestions");

    // Check if the query matches any suggestion chip (case-insensitive)
    const matchesSuggestion = suggestions.some(
      (s) => s.toLowerCase() === query.trim().toLowerCase()
    );
    const shouldTreatAsSuggestion = isSuggestion || matchesSuggestion;

    try {
      const response = await api.post("/search/", {
        query,
        is_suggestion: shouldTreatAsSuggestion,
        language: language,
      });

      if (response.data.off_topic) {
        setOffTopicMessage(response.data.message);
        setResults([]);
      } else {
        setResults(response.data.results);
        setOffTopicMessage(null);
      }
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
      setIsSuggestion(false); // Reset after search
    }
  };

  const handleReset = () => {
    setQuery("");
    setResults([]);
    setSearched(false);
    setIsInputExpanded(false);
    setOffTopicMessage(null);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <header className="mb-6 text-center flex-shrink-0">
        <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
          {t("aiSearch.title")}
        </h1>
        <p className="text-gray-400">{t("aiSearch.subtitle")}</p>
      </header>

      <div className="relative mb-8 flex justify-center">
        <AnimatePresence mode="wait">
          {!isInputExpanded ? (
            <motion.button
              key="button"
              onClick={() => setIsInputExpanded(true)}
              className="px-8 py-4 bg-white text-black rounded-full font-medium flex items-center gap-3 hover:bg-gray-100 transition-colors"
              initial={{ opacity: 1 }}
              exit={{
                opacity: 0,
                scale: 1.1,
                transition: { duration: 0.15 },
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Search className="w-5 h-5" strokeWidth={1.5} />
              {t("aiSearch.startSearch")}
            </motion.button>
          ) : (
            <motion.form
              key="input"
              onSubmit={handleSearch}
              className="w-full relative m-4"
              initial={{
                width: "220px",
                opacity: 0,
                scale: 0.8,
              }}
              animate={{
                width: "100%",
                opacity: 1,
                scale: 1,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("aiSearch.placeholder")}
                className="w-full p-4 pl-6 pr-14 bg-white rounded-full border-0 focus:ring-2 focus:ring-white focus:outline-none text-black placeholder:text-gray-400"
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-2 top-2 p-2.5 bg-black text-white rounded-full hover:bg-gray-800 disabled:opacity-50"
              >
                <Search className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {!searched && (
        <div className="text-center py-12">
          <p className="text-muted mb-4">{t("aiSearch.popular")}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {t("aiSearch.suggestions").map((s) => (
              <button
                key={s}
                onClick={() => {
                  setQuery(s);
                  setIsSuggestion(true);
                  setIsInputExpanded(true);
                }}
                className="px-4 py-2 bg-white text-black rounded-full text-sm hover:bg-gray-200"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 px-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
            <p className="text-muted text-center">{t("aiSearch.searching")}</p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {!loading && results.length > 0 && (
          <div className="flex flex-col flex-1 min-h-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4 overflow-y-auto pr-2 flex-1"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {results.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedActivity(item)}
                  className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                >
                  {item.image_url && (
                    <div className="w-full h-48 overflow-hidden">
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-black pr-4 group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </h3>
                      <span className="text-black font-bold whitespace-nowrap bg-gray-100 px-2 py-1 rounded-lg text-sm">
                        {item.price}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      {item.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {item.location}
                        </span>
                      )}
                      {item.rating && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          {item.rating}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
            <div className="mt-6 flex-shrink-0">
              <button
                onClick={handleReset}
                className="w-full py-3 bg-white text-black border-2 border-black rounded-full font-semibold hover:bg-black hover:text-white hover:border-white transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                {t("aiSearch.reset")}
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {!loading && searched && results.length === 0 && !offTopicMessage && (
        <div className="text-center py-16">
          <MapPin className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-muted">{t("aiSearch.noResults")}</p>
        </div>
      )}

      {!loading && offTopicMessage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 px-6"
        >
          <div className="bg-white rounded-2xl p-8 max-w-md mx-auto border-2 border-yellow-400">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="text-xl font-bold text-black mb-3">
              {t("aiSearch.offTopic.title")}
            </h3>
            <p className="text-gray-600 mb-6">{offTopicMessage}</p>
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              <RotateCcw className="w-4 h-4" />
              {t("aiSearch.offTopic.newSearch")}
            </button>
          </div>
        </motion.div>
      )}

      {!loading && searched && results.length === 0 && !offTopicMessage && (
        <div className="text-center py-16">
          <MapPin className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-muted">
            Nessun risultato trovato. Prova una ricerca diversa.
          </p>
        </div>
      )}

      {!loading && offTopicMessage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 px-6"
        >
          <div className="bg-white rounded-2xl p-8 max-w-md mx-auto border-2 border-yellow-400">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="text-xl font-bold text-black mb-3">
              Ops! Parliamo di Tenerife
            </h3>
            <p className="text-gray-600 mb-6">{offTopicMessage}</p>
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              <RotateCcw className="w-4 h-4" />
              Nuova Ricerca
            </button>
          </div>
        </motion.div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedActivity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedActivity(null)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {selectedActivity.image_url && (
                <div className="w-full h-64 overflow-hidden flex-shrink-0">
                  <img
                    src={selectedActivity.image_url}
                    alt={selectedActivity.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              )}

              <div className="p-6 overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-black pr-8">
                    {selectedActivity.title}
                  </h2>
                  <button
                    onClick={() => setSelectedActivity(null)}
                    className="absolute right-4 top-4 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-lg"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-3 mb-6">
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    {selectedActivity.category || "Attività"}
                  </span>
                  {selectedActivity.duration && (
                    <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {selectedActivity.duration}
                    </span>
                  )}
                  {selectedActivity.rating && (
                    <span className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-sm font-medium flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                      {selectedActivity.rating}
                    </span>
                  )}
                </div>

                <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                  {selectedActivity.description}
                </p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <span className="text-gray-500 font-medium">
                      Prezzo stimato
                    </span>
                    <span className="text-xl font-bold text-black">
                      {selectedActivity.price}
                    </span>
                  </div>

                  {selectedActivity.location && (
                    <div className="flex items-center gap-3 text-gray-600 p-2">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <span>{selectedActivity.location}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50">
                {selectedActivity.link ? (
                  <a
                    href={selectedActivity.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-full gap-2 bg-black text-white py-4 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
                  >
                    Visita il Sito <ExternalLink className="w-4 h-4" />
                  </a>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 text-center font-medium">
                      Cerca Informazioni Dettagliate
                    </p>
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(
                        selectedActivity.title + " Tenerife"
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-full gap-2 bg-black text-white py-4 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
                    >
                      Cerca su Google <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
