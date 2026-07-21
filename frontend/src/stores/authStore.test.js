import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function createLocalStorage() {
  const store = new Map();

  return {
    getItem: vi.fn((key) => (store.has(key) ? store.get(key) : null)),
    setItem: vi.fn((key, value) => {
      store.set(key, String(value));
    }),
    removeItem: vi.fn((key) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
  };
}

async function importFreshStore() {
  vi.resetModules();
  return import("./authStore");
}

describe("auth store", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createLocalStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("initializes with a null user when persisted user JSON is corrupted", async () => {
    localStorage.setItem("user", "{bad-json");

    const { useAuthStore } = await importFreshStore();

    expect(useAuthStore.getState().user).toBeNull();
  });

  it("removes token persistence when token is cleared", async () => {
    let module = await importFreshStore();
    module.useAuthStore.getState().setToken("token-123");
    expect(module.useAuthStore.getState().isAuthenticated()).toBe(true);

    module.useAuthStore.getState().setToken(null);
    expect(module.useAuthStore.getState().isAuthenticated()).toBe(false);

    module = await importFreshStore();
    expect(module.useAuthStore.getState().token).toBeNull();
    expect(module.useAuthStore.getState().isAuthenticated()).toBe(false);
  });

  it("persists user data and clears all auth data on logout", async () => {
    const { useAuthStore } = await importFreshStore();

    useAuthStore.getState().setUser({ username: "admin", role: "admin" });
    useAuthStore.getState().setToken("token-123");
    useAuthStore.getState().logout();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
  });
});
