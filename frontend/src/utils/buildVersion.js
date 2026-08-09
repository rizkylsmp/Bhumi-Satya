import { buildReloadUrl } from "./lazyWithRetry";

export const BUILD_META_URL = "/build.json";
export const BUILD_CHECK_TIMEOUT_MS = 3_000;
export const BUILD_CHECK_INTERVAL_MS = 5 * 60_000;
export const BUILD_CHECK_THROTTLE_MS = 30_000;

export const readDeployedBuild = async (fetchImpl = window.fetch.bind(window)) => {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(
    () => controller.abort(),
    BUILD_CHECK_TIMEOUT_MS,
  );
  let response;

  try {
    response = await fetchImpl(`${BUILD_META_URL}?t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
      signal: controller.signal,
    });
  } finally {
    globalThis.clearTimeout(timeoutId);
  }

  if (!response.ok) return null;
  const metadata = await response.json();
  return String(metadata?.buildId || "").trim() || null;
};

export const checkForBuildUpdate = async ({
  currentBuildId,
  fetchImpl,
  href = window.location.href,
  replace = (url) => window.location.replace(url),
} = {}) => {
  const deployedBuildId = await readDeployedBuild(fetchImpl);
  const hasUpdate = Boolean(
    deployedBuildId &&
      currentBuildId &&
      deployedBuildId !== currentBuildId,
  );

  if (hasUpdate) {
    replace(buildReloadUrl(href, deployedBuildId));
  }

  return { deployedBuildId, hasUpdate };
};

export const installBuildVersionMonitor = ({ currentBuildId }) => {
  let lastCheckedAt = 0;
  let checking = false;

  const check = async (force = false) => {
    if (
      checking ||
      (!force && Date.now() - lastCheckedAt < BUILD_CHECK_THROTTLE_MS)
    ) {
      return;
    }

    checking = true;
    lastCheckedAt = Date.now();
    try {
      await checkForBuildUpdate({ currentBuildId });
    } catch {
      // A failed version check must never interrupt the active application.
    } finally {
      checking = false;
    }
  };

  const handleFocus = () => check();
  const handleVisibility = () => {
    if (document.visibilityState === "visible") check();
  };
  const intervalId = window.setInterval(
    () => check(true),
    BUILD_CHECK_INTERVAL_MS,
  );

  window.addEventListener("focus", handleFocus);
  document.addEventListener("visibilitychange", handleVisibility);

  return () => {
    window.clearInterval(intervalId);
    window.removeEventListener("focus", handleFocus);
    document.removeEventListener("visibilitychange", handleVisibility);
  };
};
