import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const THOUSANDS_SEPARATORS = {
  COMMA: ",",
  DOT: ".",
};

const memoryStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export const useNumberFormatStore = create(
  persist(
    (set) => ({
      thousandsSeparator: THOUSANDS_SEPARATORS.COMMA,
      setThousandsSeparator: (separator) =>
        set({
          thousandsSeparator:
            separator === THOUSANDS_SEPARATORS.DOT
              ? THOUSANDS_SEPARATORS.DOT
              : THOUSANDS_SEPARATORS.COMMA,
        }),
    }),
    {
      name: "number-format-storage",
      storage: createJSONStorage(() =>
        typeof localStorage !== "undefined" &&
        typeof localStorage.setItem === "function"
          ? localStorage
          : memoryStorage,
      ),
    },
  ),
);
