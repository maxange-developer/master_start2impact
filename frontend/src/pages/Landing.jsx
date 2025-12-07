/**
 * Landing Page Component
 *
 * Public landing page shown to non-authenticated users.
 * Displays app branding and provides login/register navigation.
 *
 * Features:
 * - Minimalist black background design
 * - Large TENERIFE AI branding
 * - Italian subtitle ("Scopri esperienze straordinarie...")
 * - Login and Register CTAs
 *
 * Navigation:
 * - Login button → /login
 * - Create Account button → /register
 *
 * Design:
 * - Centered layout with vertical spacing
 * - White primary CTA, outlined secondary CTA
 * - Monospace font for branding
 *
 * Technical Notes:
 * - Accessible to unauthenticated users only
 * - No authentication required
 * - Redirected from if user already logged in (handled by routing)
 */

import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8">
      <h1 className="text-7xl mb-4 text-white tracking-tight text-center font-mono">
        TENERIFE <span className="font-bold text-8xl">AI</span>
      </h1>

      <p className="text-gray-400 mb-16 max-w-sm text-center text-lg">
        Scopri esperienze straordinarie grazie all'intelligenza artificiale.
      </p>

      <div className="w-full max-w-xs space-y-3">
        <Link
          to="/login"
          className="block w-full bg-white text-black py-4 rounded-full font-medium text-center hover:bg-gray-100"
        >
          Accedi
        </Link>

        <Link
          to="/register"
          className="block w-full bg-transparent text-white border border-gray-600 py-4 rounded-full font-medium text-center hover:bg-gray-900"
        >
          Crea Account
        </Link>
      </div>
    </div>
  );
}
