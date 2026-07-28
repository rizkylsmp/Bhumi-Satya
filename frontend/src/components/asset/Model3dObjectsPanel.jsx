import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  BuildingsIcon,
  CubeIcon,
  HashIcon,
  MagnifyingGlassIcon,
  RulerIcon,
  StackIcon,
  TagIcon,
} from "@phosphor-icons/react";
import { assetModel3dService } from "../../services/api";

const getError = (error, fallback) =>
  error?.response?.data?.error || error?.response?.data?.message || fallback;

const displayValue = (value, suffix = "") => {
  if (value === null || value === undefined || value === "") return "—";
  const numeric = Number(value);
  if (suffix && Number.isFinite(numeric)) {
    return `${numeric.toLocaleString("id-ID", {
      maximumFractionDigits: 3,
    })} ${suffix}`;
  }
  return String(value);
};

const categoryLabel = (value) =>
  ({
    bangunan: "Bangunan",
    ruang: "Ruang",
    unit: "Unit",
    komponen: "Komponen",
  })[value] || value || "Tanpa kategori";

function AttributeItem({ icon: Icon, label, value, mono = false }) {
  return (
    <div className="flex min-w-0 items-start gap-2.5 rounded-xl border border-border bg-surface-secondary/70 p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
        <Icon size={15} weight="duotone" />
      </span>
      <div className="min-w-0">
        <p className="text-[8px] font-black uppercase tracking-[0.08em] text-text-muted">
          {label}
        </p>
        <p
          className={`mt-1 break-words text-[11px] font-bold leading-relaxed text-text-primary ${
            mono ? "font-mono" : ""
          }`}
          title={value === "—" ? undefined : value}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export default function Model3dObjectsPanel({ assetId, model }) {
  const [objects, setObjects] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(false);
  const [selectedObjectId, setSelectedObjectId] = useState(null);

  const selectedObject = useMemo(
    () =>
      objects.find(
        (object) =>
          String(object.id_object_3d) === String(selectedObjectId),
      ) ||
      objects[0] ||
      null,
    [objects, selectedObjectId],
  );

  const loadObjects = useCallback(
    async (page = 1) => {
      if (!assetId || !model?.id_model_3d) {
        setObjects([]);
        setSelectedObjectId(null);
        return;
      }
      setLoading(true);
      try {
        const response = await assetModel3dService.listObjects(
          assetId,
          model.id_model_3d,
          {
            page,
            limit: pagination.limit,
            search: search || undefined,
            category,
          },
        );
        const nextObjects = response.data?.data || [];
        setObjects(nextObjects);
        setPagination((current) => ({
          ...current,
          ...(response.data?.pagination || {}),
        }));
        setSelectedObjectId((current) =>
          nextObjects.some(
            (object) =>
              String(object.id_object_3d) === String(current),
          )
            ? current
            : nextObjects[0]?.id_object_3d || null,
        );
      } catch (error) {
        toast.error(getError(error, "Gagal memuat atribut objek 3D"));
      } finally {
        setLoading(false);
      }
    },
    [assetId, category, model?.id_model_3d, pagination.limit, search],
  );

  useEffect(() => {
    const timer = setTimeout(() => loadObjects(1), 250);
    return () => clearTimeout(timer);
  }, [loadObjects]);

  if (!model) {
    return (
      <div className="flex min-h-[430px] flex-col items-center justify-center p-6 text-center">
        <CubeIcon size={32} weight="duotone" className="text-text-muted" />
        <p className="mt-3 text-xs font-black text-text-primary">
          Belum ada model terpilih
        </p>
        <p className="mt-1 max-w-xs text-[10px] leading-relaxed text-text-muted">
          Pilih versi model untuk melihat atribut objek 3D.
        </p>
      </div>
    );
  }

  const properties = Object.entries(selectedObject?.properties || {});

  return (
    <div className="space-y-3 p-4">
      <div className="rounded-xl border border-border bg-surface-secondary/60 p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="relative block min-w-0 flex-1">
            <span className="sr-only">Cari atribut objek</span>
            <MagnifyingGlassIcon
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              size={15}
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari kode, nama, atau penggunaan…"
              className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-xs text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
          </label>
          <label>
            <span className="sr-only">Filter kategori objek</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-xs font-semibold text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 sm:w-40"
            >
              <option value="all">Semua kategori</option>
              <option value="bangunan">Bangunan</option>
              <option value="ruang">Ruang</option>
              <option value="unit">Unit</option>
              <option value="komponen">Komponen</option>
            </select>
          </label>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 text-[9px] text-text-muted">
          <span>
            Model versi {model.version} · {pagination.total} objek
          </span>
          <span>Hanya tampilan data</span>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[340px] items-center justify-center rounded-xl border border-border bg-surface">
          <div className="text-center">
            <span className="mx-auto block h-5 w-5 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
            <p className="mt-2 text-[10px] font-bold text-text-muted">
              Memuat atribut objek…
            </p>
          </div>
        </div>
      ) : objects.length === 0 ? (
        <div className="flex min-h-[340px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface p-6 text-center">
          <StackIcon size={30} weight="duotone" className="text-text-muted" />
          <p className="mt-3 text-xs font-black text-text-primary">
            Atribut objek belum tersedia
          </p>
          <p className="mt-1 max-w-xs text-[10px] leading-relaxed text-text-muted">
            Belum ada atribut yang terhubung dengan versi model ini.
          </p>
        </div>
      ) : (
        <div className="grid min-h-[340px] gap-3 md:grid-cols-[minmax(190px,0.75fr)_minmax(280px,1.25fr)]">
          <div
            className="max-h-[500px] space-y-2 overflow-y-auto rounded-xl border border-border bg-surface-secondary/40 p-2"
            aria-label="Daftar objek 3D"
          >
            {objects.map((object) => {
              const active =
                String(object.id_object_3d) ===
                String(selectedObject?.id_object_3d);
              return (
                <button
                  key={object.id_object_3d}
                  type="button"
                  onClick={() =>
                    setSelectedObjectId(object.id_object_3d)
                  }
                  aria-pressed={active}
                  className={`w-full rounded-xl border p-3 text-left transition focus-visible:ring-2 focus-visible:ring-accent ${
                    active
                      ? "border-accent bg-accent/10"
                      : "border-border bg-surface hover:border-accent/40 hover:bg-accent/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        active
                          ? "bg-accent text-surface"
                          : "bg-surface-secondary text-text-muted"
                      }`}
                    >
                      <BuildingsIcon size={15} weight="duotone" />
                    </span>
                    <span className="rounded-full bg-surface-secondary px-2 py-1 text-[7px] font-black uppercase tracking-wide text-text-muted">
                      {categoryLabel(object.category)}
                    </span>
                  </div>
                  <p className="mt-2 truncate text-[11px] font-black text-text-primary">
                    {object.name || "Tanpa nama"}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[8px] text-text-muted">
                    {object.object_code || object.id_object_3d}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-[8px] text-text-secondary">
                    <span>Lantai {object.floor || "—"}</span>
                    <span aria-hidden="true">•</span>
                    <span>{displayValue(object.area_m2, "m²")}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <article className="overflow-hidden rounded-2xl border border-border bg-surface">
            <header className="border-b border-border bg-surface-secondary/60 p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-surface">
                  <CubeIcon size={20} weight="duotone" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-black text-text-primary">
                      {selectedObject.name || "Tanpa nama"}
                    </p>
                    <span className="rounded-full bg-accent/10 px-2 py-1 text-[8px] font-black uppercase tracking-wide text-accent">
                      {categoryLabel(selectedObject.category)}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-[9px] text-text-muted">
                    {selectedObject.object_code || "Kode objek tidak tersedia"}
                  </p>
                </div>
              </div>
            </header>

            <div className="space-y-3 p-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <AttributeItem
                  icon={HashIcon}
                  label="UUID Objek"
                  value={displayValue(selectedObject.id_object_3d)}
                  mono
                />
                <AttributeItem
                  icon={StackIcon}
                  label="Lantai"
                  value={displayValue(selectedObject.floor)}
                />
                <AttributeItem
                  icon={TagIcon}
                  label="Penggunaan"
                  value={displayValue(selectedObject.usage)}
                />
                <AttributeItem
                  icon={RulerIcon}
                  label="Luas"
                  value={displayValue(selectedObject.area_m2, "m²")}
                />
                <AttributeItem
                  icon={CubeIcon}
                  label="Volume"
                  value={displayValue(selectedObject.volume_m3, "m³")}
                />
                <AttributeItem
                  icon={BuildingsIcon}
                  label="Tinggi"
                  value={displayValue(selectedObject.height_m, "m")}
                />
              </div>

              {properties.length > 0 && (
                <section aria-labelledby="additional-attributes-heading">
                  <div className="mb-2 flex items-center gap-2">
                    <StackIcon size={14} className="text-accent" />
                    <h3
                      id="additional-attributes-heading"
                      className="text-[9px] font-black uppercase tracking-[0.08em] text-text-muted"
                    >
                      Atribut Tambahan
                    </h3>
                  </div>
                  <dl className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                    {properties.map(([key, value]) => (
                      <div
                        key={key}
                        className="grid gap-1 bg-surface px-3 py-2.5 sm:grid-cols-[minmax(110px,0.8fr)_minmax(0,1.2fr)]"
                      >
                        <dt className="text-[9px] font-black text-text-muted">
                          {key}
                        </dt>
                        <dd className="break-words text-[10px] font-semibold text-text-primary sm:text-right">
                          {typeof value === "object"
                            ? JSON.stringify(value)
                            : displayValue(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}
            </div>
          </article>
        </div>
      )}

      <div className="flex flex-col gap-2 text-[9px] text-text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>
          Halaman {pagination.page} dari {pagination.totalPages}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={pagination.limit}
            onChange={(event) =>
              setPagination((current) => ({
                ...current,
                limit: Number(event.target.value),
              }))
            }
            aria-label="Jumlah objek per halaman"
            className="h-8 rounded-lg border border-border bg-surface px-2 text-[9px] text-text-primary"
          >
            <option value={10}>10 / halaman</option>
            <option value={25}>25 / halaman</option>
            <option value={50}>50 / halaman</option>
          </select>
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => loadObjects(pagination.page - 1)}
            className="h-8 rounded-lg border border-border px-3 font-bold text-text-secondary transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            Sebelumnya
          </button>
          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => loadObjects(pagination.page + 1)}
            className="h-8 rounded-lg border border-border px-3 font-bold text-text-secondary transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            Berikutnya
          </button>
        </div>
      </div>
    </div>
  );
}
