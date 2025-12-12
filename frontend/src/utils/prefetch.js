/**
 * Prefetch Utilities
 *
 * Functions to prefetch images and pages for improved performance.
 * Uses requestIdleCallback for non-blocking prefetch operations.
 */

/**
 * Prefetch an image URL
 * @param {string} url - Image URL to prefetch
 */
export const prefetchImage = (url) => {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(() => {
      const img = new Image();
      img.src = url;
    });
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    setTimeout(() => {
      const img = new Image();
      img.src = url;
    }, 2000);
  }
};

/**
 * Prefetch multiple images
 * @param {string[]} urls - Array of image URLs to prefetch
 */
export const prefetchImages = (urls) => {
  urls.forEach((url) => prefetchImage(url));
};

/**
 * Prefetch a page component (for route-based code splitting)
 * Uses dynamic imports to load route components in the background
 */
export const prefetchRoute = (importFn) => {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(() => {
      importFn();
    });
  } else {
    setTimeout(() => {
      importFn();
    }, 2000);
  }
};

/**
 * Common Tenerife blog images for initial prefetch
 */
export const COMMON_BLOG_IMAGES = [
  // Featured locations
  "/images/blog/teide-1.jpg",
  "/images/blog/loro-parque-1.webp",
  "/images/blog/siam-park-1.webp",
  "/images/blog/playa-1.jpg",
  "/images/blog/anaga-1.webp",
  "/images/blog/masca-valley.jpg",
  // Popular areas
  "/images/blog/santacruz-1.jpg",
  "/images/blog/puerto-1.webp",
  "/images/blog/adeje-1.webp",
  // Activities
  "/images/blog/hiking-1.jpg",
  "/images/blog/dolphins-1.jpg",
  "/images/blog/parapendio-1.jpg",
  // Dining
  "/images/blog/eat-1.webp",
];

/**
 * Setup prefetching on app load
 * Call this in useEffect in your main App component
 */
export const setupPrefetch = () => {
  // Prefetch common images
  prefetchImages(COMMON_BLOG_IMAGES);

  // Prefetch critical pages
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    requestIdleCallback(() => {
      // Preload CSS and fonts if needed
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = "/src/pages/Blog.jsx";
      document.head.appendChild(link);
    });
  }
};

/**
 * Prefetch images on hover for specific elements
 * Usage: onMouseEnter={() => prefetchImage(imageUrl)}
 */
export const createPrefetchOnHover = (imageUrl) => {
  return () => prefetchImage(imageUrl);
};
