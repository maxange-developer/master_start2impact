/**
 * Layout Component - Shared Application Structure
 *
 * Provides consistent layout structure for all protected routes with
 * fixed navigation bar and scrollable content area.
 *
 * Layout Structure:
 * - Fixed Navbar at top (h-14)
 * - Main content area (flex-1, scrollable)
 * - Centered container (max-w-4xl)
 *
 * Key Features:
 * - Full-screen black background theme
 * - Responsive padding (px-6, py-4)
 * - Outlet for nested route rendering
 * - Overflow handling for content
 *
 * Technical Notes:
 * - Uses React Router Outlet for child routes
 * - pt-14 accounts for fixed Navbar height
 * - overflow-hidden prevents double scrollbars
 */

import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 pt-14 overflow-hidden">
        <div className="h-full max-w-4xl mx-auto px-6 py-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
