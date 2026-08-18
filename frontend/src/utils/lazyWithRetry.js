import { lazy } from "react";

export const CHUNK_LOAD_TIMEOUT_MS = 20_000;

const CHUNK_RELOAD_KEY = "bhumi-satya-chunk-reload-build";
const CURRENT_BUILD_ID = import.meta.env.VITE_BUILD_ID || "development";

const readReloadedBuild = () => {
  try {
    return window.sessionStorage.getItem(CHUNK_RELOAD_KEY) || "";
  } catch {
    return "";
  }
};

const writeReloadedBuild = (value) => {
  try {
    if (value) window.sessionStorage.setItem(CHUNK_RELOAD_KEY, String(value));
    else window.sessionStorage.removeItem(CHUNK_RELOAD_KEY);
  } catch {
    // Restricted browser storage must not disable route recovery.
  }
};

export const loadWithTimeout = (
  loader,
  timeoutMs = CHUNK_LOAD_TIMEOUT_MS,
) =>
  new Promise((resolve, reject) => {
    const timeoutId = globalThis.setTimeout(() => {
      reject(new Error("Waktu pemuatan halaman habis."));
    }, timeoutMs);

    Promise.resolve()
      .then(loader)
      .then(resolve, reject)
      .finally(() => globalThis.clearTimeout(timeoutId));
  });

export const buildReloadUrl = (
  href,
  reloadToken = Date.now(),
) => {
  const url = new URL(href);
  url.searchParams.set("bs_reload", String(reloadToken));
  return url.toString();
};

export const reloadWithCacheBust = (reloadToken = Date.now()) => {
  window.location.replace(buildReloadUrl(window.location.href, reloadToken));
};

export const canReloadForBuild = (
  reloadedBuildId,
  currentBuildId = CURRENT_BUILD_ID,
) => Boolean(currentBuildId && reloadedBuildId !== currentBuildId);

// Recover once from a stale or stalled route chunk after deployment. A second
// failure is surfaced to the router error boundary instead of spinning forever.
export const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    try {
      return await loadWithTimeout(componentImport);
    } catch (error) {
      const canReload = canReloadForBuild(readReloadedBuild());

      if (canReload) {
        writeReloadedBuild(CURRENT_BUILD_ID);
        reloadWithCacheBust(CURRENT_BUILD_ID);

        return new Promise((_, reject) => {
          window.setTimeout(() => reject(error), 8_000);
        });
      }

      throw error;
    }
  });
