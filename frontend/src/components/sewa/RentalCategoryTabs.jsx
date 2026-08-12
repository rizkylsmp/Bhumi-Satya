import { BuildingsIcon, PolygonIcon } from "@phosphor-icons/react";

const CATEGORIES = [
  { value: "Tanah", icon: PolygonIcon, description: "Bidang dan lahan" },
  { value: "Bangunan", icon: BuildingsIcon, description: "Gedung dan bangunan" },
];

export default function RentalCategoryTabs({ value, onChange, compact = false }) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-surface p-2">
      {CATEGORIES.map((category) => {
        const Icon = category.icon;
        const active = value === category.value;
        return (
          <button
            key={category.value}
            type="button"
            onClick={() => onChange(category.value)}
            className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 transition ${
              active
                ? "bg-accent text-white shadow-md shadow-accent/20"
                : "text-text-secondary hover:bg-surface-secondary"
            }`}
            aria-pressed={active}
          >
            <Icon size={compact ? 18 : 21} weight={active ? "fill" : "duotone"} />
            <span className="text-left">
              <span className="block text-xs font-bold sm:text-sm">
                Sewa {category.value}
              </span>
              {!compact && (
                <span className={`hidden text-[10px] sm:block ${active ? "text-white/75" : "text-text-muted"}`}>
                  {category.description}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
