/**
 * Root Application Component
 *
 * Defines application routing structure with protected and public routes.
 * Integrates authentication, layout, and internationalization.
 *
 * Route Structure:
 * - Public: / (Landing), /login, /register
 * - Protected (requires auth): /home, /search, /blog, /saved, /create-article
 *
 * Key Features:
 * - JWT-based route protection via ProtectedRoute
 * - Nested routes with shared Layout component
 * - Multi-language support via LanguageProvider
 * - Automatic redirect to login for unauthenticated users
 *
 * Technical Notes:
 * - Uses React Router v6 nested routes
 * - ProtectedRoute checks Zustand authStore for token
 * - Layout component provides Navbar and consistent structure
 */

import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import AISearch from "./pages/AISearch";
import Blog from "./pages/Blog";
import ArticleDetail from "./pages/ArticleDetail";
import SavedArticles from "./pages/SavedArticles";
import CreateArticle from "./pages/CreateArticle";
import Layout from "./components/Layout";
import { useAuthStore } from "./store/authStore";
import { LanguageProvider } from "./i18n/LanguageContext";

/**
 * Protected Route Wrapper Component
 *
 * Guards routes requiring authentication by checking for valid JWT token.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Protected route content
 * @returns {React.ReactNode} Children if authenticated, otherwise redirect to login
 */
function ProtectedRoute({ children }) {
  const { token } = useAuthStore();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <LanguageProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/home" element={<Home />} />
          <Route path="/search" element={<AISearch />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<ArticleDetail />} />
          <Route path="/saved" element={<SavedArticles />} />
          <Route path="/create-article" element={<CreateArticle />} />
        </Route>
      </Routes>
    </LanguageProvider>
  );
}

export default App;
