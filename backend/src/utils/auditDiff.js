const toComparableValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(toComparableValue);
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        result[key] = toComparableValue(value[key]);
        return result;
      }, {});
  }

  return value;
};

const valuesEqual = (left, right) =>
  JSON.stringify(toComparableValue(left)) === JSON.stringify(toComparableValue(right));

export const getChangedFields = (
  before = {},
  after = {},
  { ignoredFields = ["updated_at"] } = {},
) => {
  const previous = before || {};
  const next = after || {};
  const ignored = new Set(ignoredFields);
  const fields = new Set([...Object.keys(previous), ...Object.keys(next)]);

  return [...fields]
    .filter((field) => !ignored.has(field))
    .filter((field) => !valuesEqual(previous[field], next[field]))
    .sort();
};
