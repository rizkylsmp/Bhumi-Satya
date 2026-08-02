import { useMemo, useState } from "react";
import {
  CheckCircleIcon,
  FunnelSimpleIcon,
  GlobeHemisphereWestIcon,
  PlusIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { changelogEntries } from "../data/changelog";

const filters = [
  {
    id: "semua",
    label: "Semua",
    icon: GlobeHemisphereWestIcon,
    activeClass: "bg-text-primary text-surface",
  },
  {
    id: "fitur",
    label: "Fitur Baru",
    icon: PlusIcon,
    color: "text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  {
    id: "peningkatan",
    label: "Peningkatan",
    icon: CheckCircleIcon,
    color: "text-blue-600 dark:text-blue-400",
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  {
    id: "perbaikan",
    label: "Perbaikan",
    icon: WarningCircleIcon,
    color: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
];

const monthFormatter = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const dayFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

const toDate = (value) => new Date(`${value}T00:00:00Z`);

export default function DokumentasiPage() {
  const [activeFilter, setActiveFilter] = useState("semua");

  const groupedEntries = useMemo(() => {
    const visibleEntries = activeFilter === "semua"
      ? changelogEntries
      : changelogEntries.filter((entry) => entry.type === activeFilter);

    return visibleEntries.reduce((groups, entry) => {
      const month = monthFormatter.format(toDate(entry.date));
      if (!groups[month]) groups[month] = [];
      groups[month].push(entry);
      return groups;
    }, {});
  }, [activeFilter]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <header className="border-b border-border pb-7 sm:pb-9">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
          Perkembangan Bhumi Satya
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
          Changelog
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-tertiary">
          Catatan fitur baru, peningkatan, dan perbaikan yang telah dikerjakan
          pada Bhumi Satya.
        </p>
      </header>

      <div className="flex items-center gap-2 overflow-x-auto border-b border-border py-5 sm:gap-3">
        {filters.map((filter) => {
          const Icon = filter.icon;
          const active = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              aria-pressed={active}
              className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-3.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                active
                  ? filter.activeClass || "bg-accent/10 text-accent"
                  : "text-text-muted hover:bg-surface hover:text-text-primary"
              }`}
            >
              <Icon size={15} weight={active ? "bold" : "regular"} className={active ? "" : filter.color} />
              {filter.label}
            </button>
          );
        })}
        <div className="ml-auto hidden items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted sm:flex">
          <FunnelSimpleIcon size={14} />
          Filter perubahan
        </div>
      </div>

      <div className="mt-9 space-y-12">
        {Object.entries(groupedEntries).map(([month, entries]) => (
          <section key={month}>
            <h2 className="text-xl font-bold capitalize text-text-primary sm:text-2xl">
              {month}
            </h2>

            <div className="mt-4 border-t border-border">
              {entries.map((entry) => {
                const type = filters.find((filter) => filter.id === entry.type);
                return (
                  <article
                    key={entry.id}
                    className="grid gap-3 border-b border-border py-5 sm:grid-cols-[110px_minmax(0,1fr)_140px] sm:gap-5 sm:py-6"
                  >
                    <div className="flex items-center gap-2 self-start sm:flex-col sm:items-start sm:gap-1.5">
                      <time
                        dateTime={entry.date}
                        className="text-[10px] font-bold uppercase tracking-wider text-text-muted"
                      >
                        {dayFormatter.format(toDate(entry.date))}
                      </time>
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${type.badge}`}>
                        {type.label}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold leading-snug text-text-primary sm:text-base">
                        {entry.title}
                      </h3>
                      <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-text-tertiary">
                        {entry.summary}
                      </p>
                    </div>

                    <p className="self-start text-[10px] font-bold uppercase tracking-wider text-text-muted sm:text-right">
                      {entry.area}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
