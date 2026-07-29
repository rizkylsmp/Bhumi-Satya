import { useMemo, useState } from "react";

const collator = new Intl.Collator("id-ID", {
  numeric: true,
  sensitivity: "base",
});

const compareValues = (left, right) => {
  if (left == null || left === "") return right == null || right === "" ? 0 : 1;
  if (right == null || right === "") return -1;

  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }

  if (typeof left === "boolean" && typeof right === "boolean") {
    return Number(left) - Number(right);
  }

  return collator.compare(String(left), String(right));
};

export const sortTableRows = (
  rows,
  sortKey,
  sortDirection = "asc",
  getValue = (row, key) => row?.[key],
) => {
  if (!sortKey) return rows;

  return rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => {
      const leftValue = getValue(left.row, sortKey);
      const rightValue = getValue(right.row, sortKey);
      const leftEmpty = leftValue == null || leftValue === "";
      const rightEmpty = rightValue == null || rightValue === "";
      if (leftEmpty !== rightEmpty) return leftEmpty ? 1 : -1;

      const result = compareValues(leftValue, rightValue);
      const directed = sortDirection === "asc" ? result : -result;
      return directed || left.index - right.index;
    })
    .map(({ row }) => row);
};

export default function useTableSort(
  rows,
  {
    initialKey = null,
    initialDirection = "asc",
    getValue = (row, key) => row?.[key],
  } = {},
) {
  const [sortKey, setSortKey] = useState(initialKey);
  const [sortDirection, setSortDirection] = useState(initialDirection);

  const sortedRows = useMemo(() => {
    return sortTableRows(rows, sortKey, sortDirection, getValue);
  }, [getValue, rows, sortDirection, sortKey]);

  const requestSort = (key) => {
    if (sortKey === key) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection("asc");
  };

  return {
    sortedRows,
    sortKey,
    sortDirection,
    requestSort,
  };
}
