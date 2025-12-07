/**
 * Create Article Page Component (Admin Only)
 *
 * Admin interface for creating new blog articles with multi-image upload
 * and AI-powered content structuring.
 *
 * Features:
 * - Article creation form (title, content, category)
 * - Multiple image upload with previews
 * - Image removal from preview
 * - Category selection from existing categories
 * - Custom category creation
 * - AI content structuring indicator (Sparkles icon)
 * - Form validation
 * - Loading state during submission
 * - Error message display
 * - Auto-navigation to blog after creation
 *
 * Form Fields:
 * - title: Article headline (required)
 * - content: Full article body (required)
 * - category: Article classification (required)
 * - images: Multiple image files (optional)
 *
 * State:
 * - formData: Form field values object
 * - categories: Available category options
 * - imageFiles: Array of File objects to upload
 * - imagePreviews: Array of base64 image previews
 * - loading: Form submission state
 * - error: Error message string
 * - showCustomCategoryInput: Custom category input visibility
 * - customCategory: New category text input
 * - createdCategory: Newly created category (unsaved)
 *
 * Workflow:
 * 1. Upload images to /blog/upload-image (returns image URLs)
 * 2. Create article with /blog/articles (includes image URLs and content)
 * 3. Backend triggers AI structuring via ArticleStructureService
 * 4. Navigate to /blog on success
 *
 * API Endpoints:
 * - GET /blog/categories: Fetch category list
 * - POST /blog/upload-image: Upload single image
 * - POST /blog/articles: Create article with AI structuring
 *
 * Technical Notes:
 * - Admin-only page (protected route)
 * - FileReader for image previews
 * - Sequential image uploads
 * - AI structuring happens server-side
 * - Custom category not persisted until article creation
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Image as ImageIcon,
  FileText,
  Sparkles,
  Plus,
  X,
  Check,
} from "lucide-react";
import api from "../services/api";

export default function CreateArticle() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    image_url: "",
    content: "",
    category: "",
  });
  const [categories, setCategories] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [createdCategory, setCreatedCategory] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get("/blog/categories");
      setCategories(response.data);
    } catch (error) {
      console.error("Failed to fetch categories", error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setImageFiles((prev) => [...prev, ...files]);

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews((prev) => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateCustomCategory = () => {
    if (customCategory.trim() && !createdCategory) {
      setCreatedCategory(customCategory.trim());
      setFormData({ ...formData, category: customCategory.trim() });
      setCustomCategory("");
      setShowCustomCategoryInput(false);
    }
  };

  const handleRemoveCustomCategory = () => {
    setCreatedCategory(null);
    if (formData.category === createdCategory) {
      setFormData({ ...formData, category: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.title || !formData.content) {
      setError("Titolo e contenuto sono obbligatori");
      return;
    }

    setLoading(true);

    try {
      let imageUrl = formData.image_url;

      // Upload image if present
      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append("file", imageFile);

        const uploadResponse = await api.post(
          "/blog/upload-image",
          imageFormData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        imageUrl = uploadResponse.data.image_url;
      }

      // Create article with image URL
      const articleData = {
        ...formData,
        image_url: imageUrl,
      };

      const response = await api.post("/blog/articles", articleData);

      // Elegant success alert
      const successAlert = document.createElement("div");
      successAlert.className =
        "fixed top-20 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-3 animate-slide-down";
      successAlert.innerHTML = `
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span class="font-semibold">Articolo creato con successo!</span>
      `;
      document.body.appendChild(successAlert);

      setTimeout(() => {
        successAlert.remove();
        navigate(`/blog/${response.data.id}`);
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Errore durante la creazione dell'articolo"
      );
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="mb-4 flex-shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-400 hover:text-white transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-white flex-1 text-center tracking-tight">
            Scrivi Articolo
          </h1>
          <div className="w-9"></div>
        </div>
        <p className="text-gray-400 text-center text-sm">
          Scrivi il tuo articolo, l'AI penserà al design e alla formattazione
        </p>
      </header>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-lg p-6 flex-1 flex flex-col overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Title and Category - fixed at top */}
          <div className="space-y-4 flex-shrink-0 mb-4">
            {/* Titolo */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Titolo *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Inserisci il titolo dell'articolo..."
                className="w-full px-6 py-3 bg-white border border-gray-300 rounded-full focus:ring-0 focus:border-black outline-none transition-all text-gray-900"
                required
              />
            </div>

            {/* Category selection */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Categoria
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat })}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                      formData.category === cat
                        ? "bg-black text-white border-black"
                        : "bg-white text-black border-gray-300 hover:border-black"
                    }`}
                  >
                    {cat}
                  </button>
                ))}

                {/* Custom created category */}
                {createdCategory && (
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, category: createdCategory })
                    }
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all border flex items-center gap-2 ${
                      formData.category === createdCategory
                        ? "bg-black text-white border-black"
                        : "bg-white text-black border-gray-300 hover:border-black"
                    }`}
                  >
                    {createdCategory}
                    <X
                      className="w-3 h-3 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveCustomCategory();
                      }}
                    />
                  </button>
                )}

                {/* Create category chip */}
                {!createdCategory && !showCustomCategoryInput && (
                  <button
                    type="button"
                    onClick={() => setShowCustomCategoryInput(true)}
                    className="px-4 py-2 rounded-full text-sm font-medium transition-all border border-dashed border-gray-300 bg-white text-black hover:border-black flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Crea
                  </button>
                )}

                {/* Dynamic input for new category - chip style */}
                {showCustomCategoryInput && !createdCategory && (
                  <div className="px-4 py-2 rounded-full text-sm font-medium border border-gray-300 bg-white flex items-center gap-2">
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleCreateCustomCategory();
                        }
                        if (e.key === "Escape") {
                          setShowCustomCategoryInput(false);
                          setCustomCategory("");
                        }
                      }}
                      placeholder="Nuova categoria..."
                      className="bg-transparent text-black outline-none text-sm font-medium w-32"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleCreateCustomCategory}
                      className="p-1 hover:bg-green-100 rounded-full transition-colors"
                      title="Conferma"
                    >
                      <Check className="w-4 h-4 text-green-600" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomCategoryInput(false);
                        setCustomCategory("");
                      }}
                      className="p-1 hover:bg-red-100 rounded-full transition-colors"
                      title="Annulla"
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                )}
              </div>
              {formData.category && (
                <p className="text-xs text-gray-600 mt-2">
                  Selezionata:{" "}
                  <span className="font-semibold">{formData.category}</span>
                </p>
              )}
            </div>
          </div>

          {/* Expandable area - Images and Textarea */}
          <div className="flex-1 flex gap-4 min-h-0 mb-4">
            {/* Content textarea */}
            <div className="flex-1 flex flex-col min-h-0">
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Contenuto *
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Scrivi il contenuto dell'articolo..."
                className="flex-1 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none resize-none transition-all text-gray-900"
                required
              />
            </div>
            {/* Image upload */}
            <div className="flex-1 flex flex-col min-h-0">
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Immagini Copertina
              </label>
              <div className="flex-1 flex flex-col min-h-0">
                <label className="cursor-pointer mb-3">
                  <div className="w-full px-6 py-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 transition-colors text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-gray-600">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-6 h-6" />
                        <span className="text-sm font-medium">
                          Aggiungi immagini
                        </span>
                      </div>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.avif,.svg"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                {imagePreviews.length > 0 && (
                  <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-3 gap-3">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2 text-right">
                Formati supportati: JPG, PNG, WEBP, SVG, AVIF
              </p>
            </div>
          </div>

          {/* Error message and Submit button - always visible at bottom */}
          <div className="space-y-4 mt-6 flex-shrink-0">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit button with AI indicator */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black border-2 border-black hover:bg-white hover:border-black text-white hover:text-black font-semibold py-4 rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg group"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white group-hover:border-black border-t-transparent rounded-full animate-spin"></div>
                  Creazione in corso...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Crea Articolo con AI
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
