import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { useThemeStore } from "./stores/themeStore";

const BUILD_STORAGE_KEY = "bhumi-satya-build-id";

const clearStaleBrowserAssets = async () => {
  const buildId =
    import.meta.env.VITE_BUILD_ID || "development";
  const previousBuildId = localStorage.getItem(BUILD_STORAGE_KEY);

  if (previousBuildId && previousBuildId !== buildId) {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }

    if ("caches" in window) {
      const cacheNames = await window.caches.keys();
      await Promise.all(cacheNames.map((cacheName) => window.caches.delete(cacheName)));
    }
  }

  localStorage.setItem(BUILD_STORAGE_KEY, buildId);
};

// Initialize dark mode on app load
useThemeStore.getState().initDarkMode();
clearStaleBrowserAssets().catch(() => {
  // Cache cleanup is best effort and must never block the application shell.
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
