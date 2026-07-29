import { describe, expect, it } from "vitest";
import { sortTableRows } from "./useTableSort";

describe("sortTableRows", () => {
  const rows = [
    { id: 1, name: "Bidang 10", area: 80, created_at: "2026-01-03" },
    { id: 2, name: "Bidang 2", area: null, created_at: "2026-01-01" },
    { id: 3, name: "bidang 1", area: 120, created_at: "2026-01-02" },
  ];

  it("sorts Indonesian text naturally", () => {
    expect(sortTableRows(rows, "name").map((row) => row.id)).toEqual([3, 2, 1]);
  });

  it("sorts numbers and keeps empty values last", () => {
    expect(sortTableRows(rows, "area").map((row) => row.id)).toEqual([1, 3, 2]);
    expect(sortTableRows(rows, "area", "desc").map((row) => row.id)).toEqual([
      3, 1, 2,
    ]);
  });

  it("supports descending values from a custom accessor", () => {
    const result = sortTableRows(
      rows,
      "created_at",
      "desc",
      (row, key) => new Date(row[key]).getTime(),
    );

    expect(result.map((row) => row.id)).toEqual([1, 3, 2]);
  });
});
