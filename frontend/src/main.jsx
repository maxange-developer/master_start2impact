/**
 * Application Entry Point
 *
 * React application bootstrap file that initializes the root component
 * with routing and strict mode enabled.
 *
 * Key Features:
 * - React 18 concurrent features via createRoot
 * - React Router v6 for client-side routing
 * - StrictMode for development checks
 *
 * Technical Notes:
 * - Mounts to #root div in index.html
 * - BrowserRouter provides HTML5 history API routing
 * - StrictMode enables double-rendering in dev for side effect detection
 */

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
