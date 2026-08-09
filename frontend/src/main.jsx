import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { useThemeStore } from "./stores/themeStore";
import {
  checkForBuildUpdate,
  installBuildVersionMonitor,
} from "./utils/buildVersion";

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

const currentBuildId = import.meta.env.VITE_BUILD_ID || "development";

const startApplication = async () => {
  if (import.meta.env.PROD) {
    try {
      const { hasUpdate } = await checkForBuildUpdate({ currentBuildId });
      if (hasUpdate) return;
    } catch {
      // A temporary metadata outage must not block the application shell.
    }
  }

  clearStaleBrowserAssets().catch(() => {
    // Cache cleanup is best effort and must never block the application shell.
  });

  useThemeStore.getState().initDarkMode();
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );

  if (import.meta.env.PROD) {
    installBuildVersionMonitor({ currentBuildId });
  }
};

startApplication();
