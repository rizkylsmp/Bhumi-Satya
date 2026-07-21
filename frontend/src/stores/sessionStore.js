import { create } from "zustand";

const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours default (fallback, actual from backend)
const GRACE_PERIOD_MS = 5 * 60 * 1000; // 5 minutes grace after session expires

export const useSessionStore = create((set, get) => ({
  // Session expiry timestamp (milliseconds since epoch)
  expiresAt: parseInt(localStorage.getItem("sessionExpiresAt")) || null,
  // Whether the extend session dialog is showing
  showExtendDialog: false,
  // Remaining seconds
  remainingSeconds: null,
  // Timer interval id
  _intervalId: null,

  /**
   * Start session with a given duration
   */
  startSession: (durationMs = SESSION_DURATION_MS) => {
    // Show dialog 30s before JWT actually expires, so token is still valid for refresh
    const bufferMs = Math.min(30000, durationMs * 0.3);
    const expiresAt = Date.now() + durationMs - bufferMs;
    localStorage.setItem("sessionExpiresAt", expiresAt.toString());
    localStorage.removeItem("sessionGraceExpiresAt");
    set({ expiresAt, showExtendDialog: false });
    get()._startCountdown();
  },

  /**
   * Extend session with new token
   */
  extendSession: (durationMs = SESSION_DURATION_MS) => {
    const bufferMs = Math.min(30000, durationMs * 0.3);
    const expiresAt = Date.now() + durationMs - bufferMs;
    localStorage.setItem("sessionExpiresAt", expiresAt.toString());
    localStorage.removeItem("sessionGraceExpiresAt");
    set({ expiresAt, showExtendDialog: false });
    get()._startCountdown();
  },

  /**
   * Clear session (on logout)
   */
  clearSession: () => {
    const { _intervalId } = get();
    if (_intervalId) clearInterval(_intervalId);
    localStorage.removeItem("sessionExpiresAt");
    localStorage.removeItem("sessionGraceExpiresAt");
    set({
      expiresAt: null,
      showExtendDialog: false,
      remainingSeconds: null,
      _intervalId: null,
    });
  },

  /**
   * Start the countdown timer
   */
  _startCountdown: () => {
    const { _intervalId } = get();
    if (_intervalId) clearInterval(_intervalId);

    const intervalId = setInterval(() => {
      const { expiresAt } = get();
      if (!expiresAt) return;

      const remaining = Math.max(
        0,
        Math.floor((expiresAt - Date.now()) / 1000),
      );
      set({ remainingSeconds: remaining });

      if (remaining <= 0) {
        // Set grace period expiry if not already set
        if (!localStorage.getItem("sessionGraceExpiresAt")) {
          const graceExpiresAt = Date.now() + GRACE_PERIOD_MS;
          localStorage.setItem(
            "sessionGraceExpiresAt",
            graceExpiresAt.toString(),
          );
        }
        set({ showExtendDialog: true });
      }
    }, 1000);

    set({ _intervalId: intervalId });

    // Calculate initial remaining
    const { expiresAt } = get();
    if (expiresAt) {
      const remaining = Math.max(
        0,
        Math.floor((expiresAt - Date.now()) / 1000),
      );
      set({ remainingSeconds: remaining });
    }
  },

  /**
   * Resume session on page load (if session exists)
   * Returns 'expired' if grace period has passed (caller should force logout)
   */
  resumeSession: () => {
    const expiresAt = parseInt(localStorage.getItem("sessionExpiresAt"));
    if (!expiresAt) return;

    // Check if grace period has already ended (e.g. browser was closed)
    const graceExpiresAt = parseInt(
      localStorage.getItem("sessionGraceExpiresAt"),
    );
    if (graceExpiresAt && Date.now() > graceExpiresAt) {
      return "expired";
    }

    const remaining = Math.floor((expiresAt - Date.now()) / 1000);
    if (remaining <= 0) {
      // Already expired - set grace period if not set, show extend dialog
      if (!graceExpiresAt) {
        const newGraceExpiresAt = Date.now() + GRACE_PERIOD_MS;
        localStorage.setItem(
          "sessionGraceExpiresAt",
          newGraceExpiresAt.toString(),
        );
      }
      set({ expiresAt, showExtendDialog: true, remainingSeconds: 0 });
      return;
    }

    set({ expiresAt, remainingSeconds: remaining });
    get()._startCountdown();
  },

  /**
   * Dismiss dialog (will trigger logout)
   */
  dismissExtendDialog: () => {
    set({ showExtendDialog: false });
  },
}));
