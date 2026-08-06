import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MagnifyingGlassIcon,
  XIcon,
  FunnelIcon,
  ArrowCounterClockwiseIcon,
} from "@phosphor-icons/react";
import { RENTAL_FEATURE_ENABLED } from "../../config/featureFlags";
import { ASSET_FILTER_PRESETS } from "../../data/assetFilterPresets";

const normalizeOptions = (field, filterOptions) => {
  const values = field.options || filterOptions[field.optionsKey] || [];
  return values.map((option) =>
    typeof option === "object"
      ? option
      : { value: String(option), label: String(option) },
  );
};

export default function AssetSearch({
  onSearch,
  onFilterChange,
  filterOptions = {},
  filterPreset = "pusatData",
  embedded = false,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  const filterFields = useMemo(
    () =>
      (ASSET_FILTER_PRESETS[filterPreset] || ASSET_FILTER_PRESETS.pusatData)
        .filter((field) => field.feature !== "rental" || RENTAL_FEATURE_ENABLED),
    [filterPreset],
  );

  useEffect(() => {
    const timer = setTimeout(() => onSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, onSearch]);

  const updateFilter = useCallback(
    (field, value) => {
      setFilters((current) => {
        const next = { ...current, [field.key]: value };
        (field.resetKeys || []).forEach((key) => {
          next[key] = "";
        });
        onFilterChange(next);
        return next;
      });
    },
    [onFilterChange],
  );

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setFilters({});
    onSearch("");
    onFilterChange({});
  }, [onSearch, onFilterChange]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const hasActiveControls = Boolean(searchTerm) || activeFilterCount > 0;
  const selectClass =
    "h-9 min-w-0 rounded-lg border border-border bg-surface px-2.5 text-[11px] font-medium text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

  return (
    <div
      className={
        embedded
          ? "border-b border-border bg-surface p-3"
          : "rounded-2xl border border-border bg-surface p-3"
      }
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <label className="relative min-w-56 flex-1">
          <span className="sr-only">Cari data</span>
          <MagnifyingGlassIcon
            size={16}
            weight="bold"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="search"
            placeholder="Cari..."
            aria-label="Cari data"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-surface-secondary pl-9 pr-9 text-[11px] font-semibold text-text-primary outline-none transition placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/15"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              aria-label="Hapus pencarian"
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-text-muted hover:bg-surface-tertiary hover:text-text-primary"
            >
              <XIcon size={12} weight="bold" />
            </button>
          )}
        </label>
        <button
          type="button"
          onClick={() => setShowFilters((value) => !value)}
          className={`inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-[10px] font-bold transition ${
            showFilters || activeFilterCount
              ? "border-accent/40 bg-accent/10 text-accent"
              : "border-border text-text-secondary hover:bg-surface-secondary"
          }`}
          aria-expanded={showFilters}
        >
          <FunnelIcon size={14} weight={showFilters ? "fill" : "bold"} />
          Filter
          {activeFilterCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
        {hasActiveControls && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border px-3 text-[10px] font-bold text-text-secondary transition hover:border-accent hover:text-accent"
          >
            <ArrowCounterClockwiseIcon size={14} weight="bold" />
            Reset
          </button>
        )}
      </div>

      {showFilters && (
        <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border pt-2 md:grid-cols-3 xl:grid-cols-5">
          {filterFields.map((field) => {
            const options = normalizeOptions(field, filterOptions);
            return (
              <label key={field.key} className="min-w-0">
                <span className="sr-only">{field.label}</span>
                <select
                  value={filters[field.key] || ""}
                  onChange={(event) => updateFilter(field, event.target.value)}
                  className={`${selectClass} w-full`}
                  aria-label={`Filter ${field.label.toLowerCase()}`}
                >
                  <option value="">{field.allLabel}</option>
                  {options.map((option) => (
                    <option key={`${field.key}-${option.value}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
