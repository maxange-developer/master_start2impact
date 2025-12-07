/**
 * Login Page Component
 *
 * User authentication page with email/password form.
 * Handles JWT token retrieval and user session initialization.
 *
 * Features:
 * - Email and password input validation
 * - Loading state with spinner during auth
 * - Error message display for invalid credentials
 * - Language selector integration
 * - Automatic navigation to /home on success
 *
 * Authentication Flow:
 * 1. Submit email/password to /auth/login (OAuth2 format)
 * 2. Receive JWT access_token
 * 3. Store token in Zustand authStore
 * 4. Fetch user data from /auth/me
 * 5. Store user object in authStore
 * 6. Navigate to /home dashboard
 *
 * State:
 * - email: User email input
 * - password: User password input
 * - error: Error message string
 * - loading: Form submission state
 *
 * Technical Notes:
 * - Uses FormData for OAuth2 compliance (username/password fields)
 * - Stores JWT in localStorage via Zustand persist
 * - Error handling for network/auth failures
 */

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import { useLanguage } from "../i18n/LanguageContext";
import LanguageSelector from "../i18n/LanguageSelector";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();
  const { t } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("username", email);
      formData.append("password", password);

      const response = await api.post("/auth/login", formData);
      const { access_token } = response.data;

      setToken(access_token);

      const userResponse = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      setUser(userResponse.data);

      navigate("/home");
    } catch (err) {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1"></div>
          <h1 className="text-3xl font-bold text-white tracking-tight uppercase">
            {t("auth.login.title")}
          </h1>
          <div className="flex-1 flex justify-end">
            <LanguageSelector variant="auth" />
          </div>
        </div>
        <p className="text-gray-400 mb-8">{t("auth.login.email")}</p>

        {error && (
          <div className="bg-red-900/50 text-red-200 p-4 rounded-xl mb-6 text-sm border border-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              {t("auth.login.email")}
            </label>
            <input
              type="email"
              required
              className="w-full p-4 bg-white rounded-xl border-0 focus:ring-2 focus:ring-white text-black placeholder:text-gray-400"
              placeholder="tu@esempio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              {t("auth.login.password")}
            </label>
            <input
              type="password"
              required
              className="w-full p-4 bg-white rounded-xl border-0 focus:ring-2 focus:ring-white text-black placeholder:text-gray-400"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black py-4 rounded-full font-medium hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {t("auth.login.button")}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-400">
          {t("auth.login.noAccount")}{" "}
          <Link
            to="/register"
            className="text-white font-medium hover:underline"
          >
            {t("auth.login.register")}
          </Link>
        </p>

        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Indietro
        </Link>
      </div>
    </div>
  );
}
