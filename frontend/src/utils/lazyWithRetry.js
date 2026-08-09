import { lazy } from "react";

export const CHUNK_LOAD_TIMEOUT_MS = 20_000;

const CHUNK_RELOAD_KEY = "bhumi-satya-chunk-reload-at";
const CHUNK_RELOAD_COOLDOWN_MS = 60_000;

const readLastReloadAt = () => {
  try {
    return Number(window.sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0);
  } catch {
    return 0;
  }
};

const writeLastReloadAt = (value) => {
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

// Recover once from a stale or stalled route chunk after deployment. A second
// failure is surfaced to the router error boundary instead of spinning forever.
export const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    try {
      const component = await loadWithTimeout(componentImport);
      writeLastReloadAt(0);
      return component;
    } catch (error) {
      const lastReloadAt = readLastReloadAt();
      const canReload =
        Date.now() - lastReloadAt > CHUNK_RELOAD_COOLDOWN_MS;

      if (canReload) {
        writeLastReloadAt(Date.now());
        reloadWithCacheBust();

        return new Promise((_, reject) => {
          window.setTimeout(() => reject(error), 8_000);
        });
      }

      writeLastReloadAt(0);
      throw error;
    }
  });
