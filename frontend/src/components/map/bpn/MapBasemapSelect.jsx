import { MapTrifoldIcon } from "@phosphor-icons/react";

export default function MapBasemapSelect({ options, value, onChange }) {
  return (
    <label className="absolute left-3 top-3 z-10 flex h-9 items-center gap-2 rounded-lg border border-border bg-surface/95 px-2.5 text-xs font-semibold text-text-primary backdrop-blur-sm">
      <MapTrifoldIcon size={15} weight="bold" className="text-accent" />
      <span className="sr-only">Basemap</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Pilih basemap"
        className="max-w-36 bg-transparent pr-1 text-xs font-semibold text-text-primary outline-none sm:max-w-44"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
