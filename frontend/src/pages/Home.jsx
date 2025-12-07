/**
 * Home Dashboard Page Component
 *
 * Main dashboard shown after login with personalized greeting,
 * quick action buttons, and rotating image carousel.
 *
 * Features:
 * - Personalized welcome message with user name
 * - Rotating circular image carousel (6 Tenerife images)
 * - Quick action buttons:
 *   - Start AI Search → /search
 *   - View Blog → /blog
 *   - Create Article → /create-article (admin only)
 * - Saved articles count display
 * - Real-time counter updates via custom events
 *
 * Components:
 * - RotatingImages: Animated circular carousel
 *
 * State:
 * - savedCount: Number of user's saved articles
 *
 * Event Listeners:
 * - 'articleSaved': Updates saved count when article bookmarked
 *
 * Technical Notes:
 * - Uses Framer Motion for animations
 * - Fetches saved count on mount
 * - Admin-only features conditionally rendered
 * - Responsive layout with centered content
 */

import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { ArrowRight, Search, PlusCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import api from "../services/api";

// Mock images for rotating carousel
const mockImages = [
  "/images/blog/villa-1.webp",
  "/images/blog/adeje-5.avif",
  "/images/blog/anaga-6.webp",
  "/images/blog/parapendio-1.jpg",
  "/images/blog/playa-7.png",
  "/images/blog/santacruz-3.png",
];

/**
 * Rotating Images Carousel Component
 *
 * Circular animated carousel displaying 6 Tenerife activity images
 * with continuous rotation and counter-rotation for upright images.
 *
 * Features:
 * - 360° continuous rotation (12s duration)
 * - Counter-rotation keeps images upright
 * - Central AI search icon with pulse animation
 * - Circular layout (80px radius)
 *
 * Technical Notes:
 * - Uses trigonometry for circular positioning
 * - Framer Motion for smooth animations
 * - Independent rotation and counter-rotation
 * - Central icon pulses with scale animation
 */
function RotatingImages() {
  const radius = 80; // Circle radius in px
  const imageSize = 70; // Image dimensions in px

  return (
    <div className="relative w-[220px] h-[220px] flex items-center justify-center">
      {/* Rotating circle with images */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {mockImages.map((img, index) => {
          const angle = (index / mockImages.length) * 2 * Math.PI;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <motion.div
              key={index}
              className="absolute"
              style={{
                left: `calc(50% + ${x}px - ${imageSize / 2}px)`,
                top: `calc(50% + ${y}px - ${imageSize / 2}px)`,
                width: imageSize,
                height: imageSize,
              }}
              // Counter-rotation to keep images upright
              animate={{ rotate: -360 }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <img
                src={img}
                alt={`Activity ${index + 1}`}
                className="w-full h-full rounded-full object-cover shadow-lg"
              />
            </motion.div>
          );
        })}
      </motion.div>

      {/* Icona centrale - sfondo trasparente, icona e testo neri con effetto pulse */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Search className="w-6 h-6 text-black mb-0.5" />
        <span className="text-xs font-bold text-black tracking-wide">AI</span>
      </motion.div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuthStore();
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchSavedCount();
    }
  }, [user]);

  // Event listener to update counter when article is saved
  useEffect(() => {
    const handleSavedUpdate = () => {
      fetchSavedCount();
    };
    window.addEventListener("articleSaved", handleSavedUpdate);
    return () => window.removeEventListener("articleSaved", handleSavedUpdate);
  }, []);

  const fetchSavedCount = async () => {
    if (!user) return;
    try {
      const response = await api.get("/blog/saved");
      setSavedCount(response.data.length);
    } catch (error) {
      console.error("Failed to fetch saved articles", error);
    }
  };

  return (
    <div className="h-full overflow-hidden">
      <header className="mb-8 flex items-end justify-center gap-2">
        <p className="text-gray-400">Bentornato,</p>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          {user?.full_name?.split(" ")[0]}! 👋
        </h1>
      </header>

      <Link to="/search" className="block group">
        <div className="bg-white rounded-2xl p-8 text-black relative overflow-hidden">
          <div className="flex items-center justify-between">
            {/* Text content on left side */}
            <div className="relative z-10 flex-1">
              <h2 className="text-2xl font-semibold mb-2 tracking-tight text-black">
                Ricerca Attività AI
              </h2>
              <p className="text-gray-600 mb-6 max-w-sm">
                Descrivi cosa stai cercando e lascia che l'AI trovi le attività
                perfette per te.
              </p>
              <div className="inline-flex items-center gap-2 text-black font-medium group-hover:gap-3 transition-all">
                Inizia a cercare <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Circular animation on right side */}
            <div className="hidden sm:flex items-center justify-center">
              <RotatingImages />
            </div>
          </div>
        </div>
      </Link>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <Link
          to="/blog"
          className="block p-6 bg-white rounded-2xl hover:bg-gray-100"
        >
          <h3 className="font-semibold text-black mb-1">Blog</h3>
          <p className="text-sm text-gray-500">Consigli & Guide</p>
        </Link>
        {savedCount > 0 ? (
          <Link
            to="/saved"
            className="block p-6 bg-white rounded-2xl hover:bg-gray-100"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-black mb-1">Salvati</h3>
              <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-xs font-semibold flex items-center justify-center">
                {savedCount}
              </span>
            </div>
            <p className="text-sm text-gray-500">I tuoi preferiti</p>
          </Link>
        ) : (
          <div className="p-6 bg-white/50 rounded-2xl cursor-not-allowed">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-400 mb-1">Salvati</h3>
              <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-400 text-xs font-semibold flex items-center justify-center">
                0
              </span>
            </div>
            <p className="text-sm text-gray-400">I tuoi preferiti</p>
          </div>
        )}
      </div>

      {user?.is_admin && (
        <Link
          to="/create-article"
          className="block mt-4 p-6 bg-black border-2 border-white rounded-2xl hover:bg-white transition-all group"
        >
          <div className="flex items-center gap-3">
            <PlusCircle
              className="w-6 h-6 text-white group-hover:text-black"
              strokeWidth={2}
            />
            <div>
              <h3 className="font-semibold text-white group-hover:text-black mb-1">
                Crea Articolo con l'AI
              </h3>
              <p className="text-sm text-white/80 group-hover:text-black/80">
                Scrivi articoli in pochi minuti con l'aiuto dell'intelligenza
                artificiale
              </p>
            </div>
          </div>
        </Link>
      )}
    </div>
  );
}
