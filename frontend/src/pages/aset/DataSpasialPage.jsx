import SubstansiAssetPage from "../../components/asset/SubstansiAssetPage";
import { useNavigate } from "react-router-dom";
import {
  GlobeHemisphereWestIcon,
  MapPinIcon,
  PolygonIcon,
  NavigationArrowIcon,
} from "@phosphor-icons/react";

const columns = [
  {
    key: "lokasi",
    label: "Lokasi",
    type: "location",
    minWidth: "64",
  },
  {
    key: "koordinat_lat",
    label: "Latitude",
    type: "coordinate",
    sortable: true,
  },
  {
    key: "koordinat_long",
    label: "Longitude",
    type: "coordinate",
    sortable: true,
  },
  {
    key: "luas",
    label: "Luas (m²)",
    type: "area",
    sortable: true,
    align: "right",
  },
  {
    key: "polygon_bidang",
    label: "Polygon",
    minWidth: "200px",
    render: (value) => {
      const hasPolygon = value && value !== "null" && value !== "";
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
            hasPolygon
              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
              : "bg-gray-50 dark:bg-gray-500/10 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-500/30"
          }`}
        >
          <PolygonIcon size={14} weight={hasPolygon ? "fill" : "regular"} />
          {hasPolygon ? "Tersedia" : "Belum ada"}
        </span>
      );
    },
  },
];

const hasPolygon = (asset) =>
  asset.polygon_bidang &&
  asset.polygon_bidang !== "null" &&
  asset.polygon_bidang !== "";

const hasCoordinates = (asset) =>
  asset.koordinat_lat !== null &&
  asset.koordinat_lat !== undefined &&
  asset.koordinat_lat !== "" &&
  asset.koordinat_long !== null &&
  asset.koordinat_long !== undefined &&
  asset.koordinat_long !== "" &&
  Number.isFinite(Number(asset.koordinat_lat)) &&
  Number.isFinite(Number(asset.koordinat_long));

const statsCards = (assets, totalItems, assetStats) => [
  {
    label: "Total Aset",
    value: assetStats?.totalAset ?? totalItems,
    icon: GlobeHemisphereWestIcon,
    iconBg: "bg-cyan-100 dark:bg-cyan-900/30",
    iconColor: "text-cyan-600 dark:text-cyan-400",
  },
  {
    label: "Memiliki Koordinat",
    value:
      assetStats?.totalKoordinat ??
      assets.filter((a) => a.koordinat_lat && a.koordinat_long).length,
    icon: NavigationArrowIcon,
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    label: "Memiliki Polygon",
    value: assetStats?.totalPolygon ?? assets.filter(hasPolygon).length,
    icon: PolygonIcon,
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    label: "Tanpa Koordinat",
    value:
      assetStats?.totalTanpaKoordinat ??
      assets.filter((a) => !a.koordinat_lat || !a.koordinat_long).length,
    icon: MapPinIcon,
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
];

export default function DataSpasialPage() {
  const navigate = useNavigate();

  const renderMapAction = (asset) => {
    const canOpenMap = hasCoordinates(asset);
    const title = canOpenMap
      ? `Lihat ${asset.nama_aset} di peta`
      : "Koordinat belum tersedia";

    return (
      <button
        type="button"
        onClick={() =>
          navigate("/peta", {
            state: {
              highlightAssetId: asset.id_aset,
              openWebgisPopup: true,
              mapMode: "2d",
            },
          })
        }
        disabled={!canOpenMap}
        title={title}
        aria-label={title}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-3 text-[9px] font-black text-accent transition hover:border-accent/50 hover:bg-accent/15 focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-secondary disabled:text-text-muted disabled:opacity-60"
      >
        <NavigationArrowIcon size={12} weight="bold" />
        <span>Peta</span>
      </button>
    );
  };

  return (
    <SubstansiAssetPage
      title="Data Spasial"
      subtitle="Koordinat dan geometri aset."
      icon={GlobeHemisphereWestIcon}
      iconColor="from-cyan-500 to-cyan-600"
      columns={columns}
      statsCards={statsCards}
      substansi="spasial"
      renderRowActions={renderMapAction}
    />
  );
}
