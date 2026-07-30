import { beforeEach, describe, expect, it } from "vitest";
import {
  formatCurrency,
  formatEditableNumber,
  formatNumber,
  parseEditableNumber,
} from "./format";
import {
  THOUSANDS_SEPARATORS,
  useNumberFormatStore,
} from "../stores/numberFormatStore";

describe("number formatting preference", () => {
  beforeEach(() => {
    useNumberFormatStore.setState({
      thousandsSeparator: THOUSANDS_SEPARATORS.COMMA,
    });
  });

  it("menggunakan koma sebagai pemisah ribuan bawaan", () => {
    expect(formatNumber(1000)).toBe("1,000");
    expect(formatCurrency(1250000)).toBe("Rp 1,250,000");
  });

  it("menggunakan titik setelah preferensi diubah", () => {
    useNumberFormatStore.setState({
      thousandsSeparator: THOUSANDS_SEPARATORS.DOT,
    });

    expect(formatNumber(1000)).toBe("1.000");
    expect(formatCurrency(1250000)).toBe("Rp 1.250.000");
  });

  it("memformat input tanpa mengubah nilai numerik mentah", () => {
    expect(formatEditableNumber("1250000.5", ",")).toBe("1,250,000.5");
    expect(parseEditableNumber("1,250,000.5", ",")).toBe("1250000.5");
    expect(formatEditableNumber("1250000.5", ".")).toBe("1.250.000,5");
    expect(parseEditableNumber("1.250.000,5", ".")).toBe("1250000.5");
  });
});
