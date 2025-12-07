/**
 * Registration Page Component
 *
 * New user account creation page with automatic login after registration.
 * Collects email, password, and full name for user profile.
 *
 * Features:
 * - Email, password, and full name inputs
 * - Loading state with spinner during registration
 * - Error handling for duplicate emails
 * - Language selector integration
 * - Auto-login after successful registration
 * - Automatic navigation to /home
 *
 * Registration Flow:
 * 1. Submit registration to /auth/register (email, password, full_name)
 * 2. On success, immediately login with same credentials
 * 3. Retrieve JWT access_token from /auth/login
 * 4. Store token in authStore
 * 5. Fetch user data from /auth/me
 * 6. Store user object in authStore
 * 7. Navigate to /home dashboard
 *
 * State:
 * - email: User email input
 * - password: User password input
 * - fullName: User display name
 * - error: Error message (e.g., "Email already taken")
 * - loading: Form submission state
 *
 * Technical Notes:
 * - Two API calls: register + login
 * - Uses FormData for OAuth2 login compliance
 * - Email uniqueness validated server-side
 */

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import { useLanguage } from "../i18n/LanguageContext";
import LanguageSelector from "../i18n/LanguageSelector";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
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
      await api.post("/auth/register", {
        email,
        password,
        full_name: fullName,
      });

      const formData = new FormData();
      formData.append("username", email);
      formData.append("password", password);

      const loginResponse = await api.post("/auth/login", formData);
      const { access_token } = loginResponse.data;

      setToken(access_token);

      const userResponse = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      setUser(userResponse.data);

      navigate("/home");
    } catch (err) {
      console.error(err);
      setError("Registration failed. Email might be taken.");
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
            {t("auth.register.title")}
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
              {t("auth.register.username")}
            </label>
            <input
              type="text"
              required
              className="w-full p-4 bg-white rounded-xl border-0 focus:ring-2 focus:ring-white text-black placeholder:text-gray-400"
              placeholder="Mario Rossi"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              {t("auth.register.email")}
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
              {t("auth.register.password")}
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
            {t("auth.register.button")}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-400">
          {t("auth.register.hasAccount")}{" "}
          <Link to="/login" className="text-white font-medium hover:underline">
            {t("auth.register.login")}
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
