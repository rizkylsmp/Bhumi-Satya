import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AssetSearch from "../../components/asset/AssetSearch";
import Pagination from "../../components/asset/Pagination";
import AssetViewModal from "../../components/asset/AssetViewModal";
import ActionButtons from "../../components/asset/ActionButtons";
import { asetService } from "../../services/api";
import { useAuthStore } from "../../stores/authStore";
import { hasPermission } from "../../utils/permissions";
import { downloadAssetPdf } from "../../utils/pdfExport";
import { downloadAssetGeojson } from "../../utils/geojsonExport";
import { useConfirm } from "../../components/ui/confirmContext";
import useColumnResize from "../../hooks/useColumnResize";
import { formatCurrency, formatNumber } from "../../utils/format";
import {
  DatabaseIcon,
  PlusIcon,
  ArrowsClockwiseIcon,
  FolderIcon,
  PackageIcon,
  CaretUpIcon,
  CaretDownIcon,
  CaretUpDownIcon,
  CalendarIcon,
  BuildingsIcon,
  MapPinIcon,
  NavigationArrowIcon,
  HandshakeIcon,
} from "@phosphor-icons/react";

const SortIcon = ({ column, sortBy, sortOrder }) => {
  if (sortBy !== column)
    return (
      <CaretUpDownIcon
        size={14}
        className="text-text-muted ml-1 inline opacity-50"
      />
    );
  return sortOrder === "asc" ? (
    <CaretUpIcon size={14} weight="bold" className="text-accent ml-1 inline" />
  ) : (
    <CaretDownIcon
      size={14}
      weight="bold"
      className="text-accent ml-1 inline"
    />
  );
};

const isAssetCertified = (asset) => {
  const status = String(asset?.status_sertifikat || "").toLowerCase();
  if (status.includes("belum") || status.includes("tidak")) return false;
  if (
    status.includes("telah") ||
    status.includes("sudah") ||
    status.includes("bersertifikat")
  ) {
    return true;
  }
  return String(asset?.nomor_sertifikat || "").trim().length > 10;
};

export default function AssetPage() {
  // Auth & Permissions
  const useCompactAssetTable = false;
  const userRole = useAuthStore((state) => state.user?.role || "");
  const canCreate = hasPermission(userRole, "aset", "create");
  const canUpdate = hasPermission(userRole, "aset", "update");
  const canDelete = hasPermission(userRole, "aset", "delete");
  const confirm = useConfirm();
  const navigate = useNavigate();

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({});
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingAsset, setViewingAsset] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    kecamatan: [],
    kelurahan: [],
  });

  // Sort state
  const [sortBy, setSortBy] = useState("kode_aset");
  const [sortOrder, setSortOrder] = useState("asc");
  const [hoveredRow, setHoveredRow] = useState(null);
  const { columnWidths, onResizeStart } = useColumnResize();

  // Fetch assets from API
  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...Object.fromEntries(
          Object.entries(filters).filter(([, value]) => Boolean(value)),
        ),
      };
      const response = await asetService.getAll(params);
      const { data, pagination } = response.data;
      setAssets(data || []);
      setTotalPages(pagination?.totalPages || 1);
      setTotalItems(pagination?.totalItems || 0);
    } catch (error) {
      console.error("Error fetching assets:", error);
      toast.error("Gagal memuat data aset");
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filters, itemsPerPage]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Fetch filter options (kecamatan/kelurahan from actual data)
  useEffect(() => {
    asetService
      .getFilterOptions()
      .then((res) => {
        if (res.data?.data) setFilterOptions(res.data.data);
      })
      .catch(() => {});
  }, []);

  // Navigate to map with asset highlighted
  const handleShowOnMap = (asset) => {
    const targetAssetId = asset?.id_aset || asset?.id;
    if (!targetAssetId) {
      toast.error(
        "Aset tidak memiliki ID yang valid untuk ditampilkan di peta",
      );
      return;
    }

    navigate("/peta", {
      state: {
        highlightAssetId: targetAssetId,
        openWebgisPopup: true,
        mapMode: "2d",
      },
    });
  };

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleItemsPerPageChange = useCallback((newLimit) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1);
  }, []);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleOpenAddForm = () => {
    navigate("/aset/tambah");
  };

  const handleOpenEditForm = (assetId) => {
    navigate(`/aset/${assetId}/kelola`);
  };

  const handleViewAsset = async (assetId) => {
    try {
      const response = await asetService.getById(assetId);
      setViewingAsset(response.data.data);
      setIsViewModalOpen(true);
    } catch (error) {
      console.error("Error fetching asset:", error);
      toast.error("Gagal memuat data aset");
    }
  };

  const handleDownloadAssetPdf = async (asset) => {
    const toastId = toast.loading("Menyiapkan PDF tanah...");
    try {
      const assetId = asset?.id_aset || asset?.id;
      const response = assetId ? await asetService.getById(assetId) : null;
      await downloadAssetPdf(response?.data?.data || asset);
      toast.success("PDF tanah mulai diunduh", { id: toastId });
    } catch (error) {
      console.error("Error preparing asset PDF:", error);
      await downloadAssetPdf(asset);
      toast.success("PDF tanah dibuat dari data tabel", { id: toastId });
    }
  };

  const handleDownloadAssetGeojson = async (asset) => {
    const toastId = toast.loading("Menyiapkan GeoJSON aset...");
    try {
      const assetId = asset?.id_aset || asset?.id;
      const response = assetId ? await asetService.getById(assetId) : null;
      const fullAsset = response?.data?.data || asset;
      const downloaded = downloadAssetGeojson(fullAsset);
      if (!downloaded) {
        toast.error("Aset belum memiliki polygon untuk diekspor", {
          id: toastId,
        });
        return;
      }
      toast.success("GeoJSON aset mulai diunduh", { id: toastId });
    } catch (error) {
      console.error("Error preparing asset GeoJSON:", error);
      const downloaded = downloadAssetGeojson(asset);
      if (downloaded) {
        toast.success("GeoJSON dibuat dari data tabel", { id: toastId });
      } else {
        toast.error("Aset belum memiliki polygon untuk diekspor", {
          id: toastId,
        });
      }
    }
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setViewingAsset(null);
  };

  const handleDeleteAsset = async (assetId) => {
    const confirmed = await confirm({
      title: "Hapus Aset",
      message:
        "Apakah Anda yakin ingin menghapus aset ini? Data yang dihapus tidak dapat dikembalikan.",
      confirmText: "Hapus",
      cancelText: "Batal",
      type: "danger",
    });
    if (!confirmed) return;

    try {
      await asetService.delete(assetId);
      toast.success("Aset berhasil dihapus");
      fetchAssets();
    } catch (error) {
      console.error("Error deleting asset:", error);
      const errorMsg = error.response?.data?.error || "Gagal menghapus aset";
      toast.error(errorMsg);
    }
  };

  // Sorted data
  const sortedAssets = [...assets].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    if (sortBy === "luas" || sortBy === "nilai_aset") {
      aVal = parseFloat(aVal) || 0;
      bVal = parseFloat(bVal) || 0;
    }
    if (sortOrder === "asc") return aVal > bVal ? 1 : -1;
    return aVal < bVal ? 1 : -1;
  });

  // Table Header component
  const TableHeader = ({
    children,
    sortable,
    column,
    className = "",
    colKey,
  }) => {
    const key = colKey || column || children?.toString();
    return (
      <th
        className={`relative px-3 py-3 text-left text-[10px] font-semibold text-text-muted uppercase tracking-wider ${
          sortable
            ? "cursor-pointer select-none hover:text-text-secondary transition-colors"
            : ""
        } ${className}`}
        style={columnWidths[key] ? { width: columnWidths[key] } : undefined}
        onClick={sortable ? () => handleSort(column) : undefined}
      >
        <span className="flex items-center gap-1">
          {children}
          {sortable && (
            <SortIcon column={column} sortBy={sortBy} sortOrder={sortOrder} />
          )}
        </span>
        <div
          onMouseDown={onResizeStart(key)}
          className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-accent/20 transition-colors z-10"
        />
      </th>
    );
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Page Header */}
      <div className="admin-page-header">
        <div className="admin-page-header__identity">
          <div className="admin-page-header__icon bg-linear-to-br from-blue-500 to-blue-600">
            <DatabaseIcon size={21} weight="fill" className="text-surface" />
          </div>
          <div>
            <h1 className="admin-page-header__title">
              Pusat Data Tanah
            </h1>
            <p className="admin-page-header__description">
              Master data tanah terpadu.
            </p>
          </div>
        </div>

        <div className="admin-page-header__actions">
          <button
            onClick={fetchAssets}
            disabled={loading}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 text-xs font-bold text-text-secondary transition hover:border-accent hover:text-accent disabled:opacity-50"
          >
            <ArrowsClockwiseIcon
              size={15}
              weight="bold"
              className={loading ? "animate-spin" : ""}
            />
            <span>Refresh</span>
          </button>

          {canCreate && (
            <button
              onClick={handleOpenAddForm}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-accent px-3 text-xs font-bold text-surface transition hover:bg-accent/90"
            >
              <PlusIcon size={15} weight="bold" />
              Daftarkan Aset Baru
            </button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <AssetSearch
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          filterOptions={filterOptions}
          embedded
        />

        {/* Table Info Header */}
        <div className="flex items-center justify-between border-b border-border bg-surface-secondary/50 px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-text-primary">
              Daftar Aset Terdaftar
            </span>
            <span className="px-2.5 py-0.5 bg-accent/10 text-accent text-xs font-semibold rounded-full">
              {totalItems} data
            </span>
          </div>
          <div className="text-xs text-text-muted">
            Halaman {currentPage} dari {totalPages}
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="overflow-hidden">
            <div className="bg-linear-to-r from-surface-secondary to-surface border-b border-border px-4 py-4">
              <div className="flex gap-4">
                {[40, 80, 120, 160, 80, 100, 80, 80].map((w, i) => (
                  <div
                    key={i}
                    className="h-4 bg-surface-tertiary rounded animate-pulse"
                    style={{ width: w }}
                  />
                ))}
              </div>
            </div>
            <div className="divide-y divide-border">
              {[...Array(5)].map((_, idx) => (
                <div
                  key={idx}
                  className="px-4 py-5 flex gap-4 items-center animate-pulse"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="w-8 h-4 bg-surface-tertiary rounded" />
                  <div className="w-24 h-5 bg-surface-tertiary rounded" />
                  <div className="w-32 h-4 bg-surface-tertiary rounded" />
                  <div className="w-40 h-4 bg-surface-tertiary rounded" />
                  <div className="w-20 h-6 bg-surface-tertiary rounded-full" />
                  <div className="w-20 h-4 bg-surface-tertiary rounded" />
                  <div className="w-16 h-4 bg-surface-tertiary rounded" />
                  <div className="w-24 h-8 bg-surface-tertiary rounded-lg ml-auto" />
                </div>
              ))}
            </div>
          </div>
        ) : assets.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-20 h-20 bg-surface-secondary rounded-2xl flex items-center justify-center mx-auto mb-6">
              <PackageIcon
                size={40}
                weight="duotone"
                className="text-text-muted"
              />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Belum ada aset terdaftar
            </h3>
            <p className="text-text-muted text-sm max-w-sm mx-auto mb-5">
              Daftarkan aset baru terlebih dahulu, kemudian lengkapi data
              substansinya di masing-masing menu.
            </p>
            {canCreate && (
              <button
                onClick={handleOpenAddForm}
                className="inline-flex items-center gap-2 bg-linear-to-r from-accent to-accent/90 text-surface px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-accent/30 transition-all text-sm font-medium"
              >
                <PlusIcon size={18} weight="bold" />
                Daftarkan Aset Baru
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden xl:block">
              <table className="admin-data-table table-fixed">
                <thead>
                  <tr className="bg-surface-secondary border-b border-border">
                    <TableHeader className="w-12">No</TableHeader>
                    {useCompactAssetTable ? (
                      <>
                        <TableHeader
                          sortable
                          column="kode_aset"
                          className="min-w-[170px]"
                        >
                          Kode Tanah
                        </TableHeader>
                        <TableHeader
                          sortable
                          column="kecamatan"
                          className="min-w-[120px]"
                        >
                          Kecamatan
                        </TableHeader>
                        <TableHeader
                          sortable
                          column="desa_kelurahan"
                          className="min-w-[120px]"
                        >
                          Kelurahan
                        </TableHeader>
                        <TableHeader
                          sortable
                          column="jenis_hak"
                          className="min-w-[100px]"
                        >
                          Hak
                        </TableHeader>
                        <TableHeader
                          sortable
                          column="nomor_sertifikat"
                          className="min-w-[150px]"
                        >
                          No Sertifikat
                        </TableHeader>
                        <TableHeader className="min-w-[130px]">
                          Penggunaan
                        </TableHeader>
                        <TableHeader
                          sortable
                          column="luas"
                          className="min-w-[120px]"
                        >
                          Luas (m²)
                        </TableHeader>
                        <TableHeader className="min-w-[150px]">
                          Catatan
                        </TableHeader>
                        <TableHeader
                          sortable
                          column="tanggal_sertifikat"
                          className="min-w-[110px]"
                        >
                          Tgl Sertifikat
                        </TableHeader>
                        <TableHeader className="min-w-[90px]">
                          Thn Scan
                        </TableHeader>
                        <TableHeader className="min-w-[100px]">
                          ID Pemda
                        </TableHeader>
                        <TableHeader
                          sortable
                          column="nibar"
                          className="min-w-[150px]"
                        >
                          NIBAR
                        </TableHeader>
                        <TableHeader
                          sortable
                          column="kode_barang"
                          className="min-w-[110px]"
                        >
                          Kode Barang
                        </TableHeader>
                        <TableHeader className="min-w-[90px]">
                          No Register
                        </TableHeader>
                        <TableHeader
                          sortable
                          column="opd_pengguna"
                          className="min-w-[160px]"
                        >
                          UPT / OPD
                        </TableHeader>
                        <TableHeader
                          sortable
                          column="luas_kib"
                          className="min-w-[90px]"
                        >
                          Luas KIB
                        </TableHeader>
                        <TableHeader className="min-w-[200px]">
                          Alamat
                        </TableHeader>
                        <TableHeader className="min-w-[140px]">
                          Penggunaan KIB
                        </TableHeader>
                        <TableHeader
                          sortable
                          column="kw"
                          className="min-w-[70px]"
                        >
                          KW
                        </TableHeader>
                        <TableHeader
                          sortable
                          column="harga_perolehan"
                          className="min-w-[130px]"
                        >
                          Harga Perolehan
                        </TableHeader>
                        <TableHeader
                          sortable
                          column="nilai_aset"
                          className="min-w-[130px]"
                        >
                          Nilai Aset
                        </TableHeader>
                        <TableHeader className="min-w-[120px]">
                          Penyertifikatan
                        </TableHeader>
                        <TableHeader className="min-w-[90px]">
                          Plotting
                        </TableHeader>
                        <TableHeader className="min-w-[110px]">
                          Status Sewa
                        </TableHeader>
                        <TableHeader className="text-center w-14">
                          Map
                        </TableHeader>
                      </>
                    ) : (
                      <>
                        <TableHeader
                          sortable
                          column="kode_aset"
                          className="w-[13%]"
                        >
                          Kode Tanah
                        </TableHeader>
                        <TableHeader
                          sortable
                          column="nama_aset"
                          className="w-[18%]"
                        >
                          Nama Tanah
                        </TableHeader>
                        <TableHeader className="w-[19%]">
                          Lokasi
                        </TableHeader>
                        <TableHeader
                          sortable
                          column="kecamatan"
                          className="hidden"
                        >
                          Kecamatan
                        </TableHeader>
                        <TableHeader
                          sortable
                          column="desa_kelurahan"
                          colKey="desa_kelurahan"
                          className="hidden"
                        >
                          Kelurahan
                        </TableHeader>
                        <TableHeader
                          sortable
                          column="luas"
                          className="w-[9%] text-right"
                        >
                          Luas
                        </TableHeader>
                        <TableHeader
                          sortable
                          column="jenis_hak"
                          colKey="jenis_hak_bpn"
                          className="w-[15%]"
                        >
                          Legal
                        </TableHeader>
                        <TableHeader
                          sortable
                          column="nomor_sertifikat"
                          colKey="nosert_bpn"
                          className="hidden"
                        >
                          No Sertifikat
                        </TableHeader>
                        <TableHeader
                          sortable
                          column="kw"
                          className="hidden"
                        >
                          KW
                        </TableHeader>
                        <TableHeader
                          sortable
                          column="nilai_aset"
                          className="w-[13%] text-right"
                        >
                          Nilai
                        </TableHeader>
                        <TableHeader className="hidden">
                          Penyertifikatan
                        </TableHeader>
                        <TableHeader className="hidden">
                          Plotting
                        </TableHeader>
                        <TableHeader
                          sortable
                          column="opd_pengguna"
                          className="w-[15%]"
                        >
                          Pemanfaatan
                        </TableHeader>
                        <TableHeader
                          sortable
                          column="tahun_perolehan"
                          className="hidden"
                        >
                          Tahun
                        </TableHeader>
                      </>
                    )}
                    <th className="sticky right-0 z-30 w-[184px] bg-surface-secondary px-3 py-3 text-center text-[11px] font-semibold text-text-muted uppercase tracking-wider border-l border-border/50">
                      Kelola
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {sortedAssets.map((asset, idx) => {
                    const isHovered = hoveredRow === asset.id_aset;
                    const hasCoords =
                      asset.koordinat_lat && asset.koordinat_long;

                    return (
                      <tr
                        key={asset.id_aset}
                        className={`group transition-all duration-200 ${
                          isHovered
                            ? "bg-accent/5 dark:bg-accent/10"
                            : "hover:bg-surface-secondary/50"
                        }`}
                        onMouseEnter={() => setHoveredRow(asset.id_aset)}
                        onMouseLeave={() => setHoveredRow(null)}
                      >
                        <td className="px-3 py-3">
                          <span className="text-sm text-text-muted font-medium">
                            {(currentPage - 1) * itemsPerPage + idx + 1}
                          </span>
                        </td>

                        {useCompactAssetTable ? (
                          <>
                            <td className="px-2.5 py-2">
                              <div className="flex flex-col items-start gap-1">
                                <span className="inline-flex items-center gap-2 px-2.5 py-1 bg-surface-secondary rounded-lg text-sm font-mono font-semibold text-text-primary">
                                  {asset.kode_aset || "-"}
                                </span>
                                {asset.kode_2d && <span className="px-1 font-mono text-[8px] font-bold text-accent">{asset.kode_2d}</span>}
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <span className="text-sm text-text-secondary whitespace-nowrap">
                                {asset.kecamatan || "-"}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className="text-sm font-medium text-text-primary whitespace-nowrap">
                                {asset.desa_kelurahan || "-"}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className="text-xs text-text-secondary whitespace-nowrap">
                                {asset.jenis_hak || "-"}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className="text-sm font-mono font-semibold text-text-primary">
                                {asset.nomor_sertifikat || "-"}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className="text-xs text-text-secondary wrap-break-word max-w-[130px] inline-block">
                                {asset.penggunaan_saat_ini || "-"}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-right">
                              <span className="text-sm text-text-secondary tabular-nums">
                                {asset.luas
                                  ? formatNumber(Number(asset.luas))
                                  : "-"}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className="text-xs text-text-muted wrap-break-word max-w-[150px] inline-block">
                                {asset.notes || "-"}
                              </span>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <span className="text-xs text-text-secondary">
                                {asset.tanggal_sertifikat || "-"}
                              </span>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <span className="text-xs text-text-secondary">
                                {asset.tanggal_scan || "-"}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className="text-xs font-mono text-text-muted">
                                {asset.id_pemda || "-"}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className="text-[10px] font-mono text-text-muted break-all max-w-[150px] inline-block">
                                {asset.nibar || "-"}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className="text-xs font-mono text-text-muted">
                                {asset.kode_barang || "-"}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className="text-xs text-text-secondary">
                                {asset.no_register || "-"}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className="text-xs text-text-secondary wrap-break-word max-w-[160px] inline-block">
                                {asset.opd_pengguna || "-"}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-right">
                              <span className="text-sm text-text-secondary tabular-nums">
                                {asset.luas_kib
                                  ? formatNumber(Number(asset.luas_kib))
                                  : "-"}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className="text-xs text-text-secondary wrap-break-word max-w-[200px] inline-block">
                                {asset.lokasi || "-"}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className="text-xs text-text-secondary wrap-break-word max-w-[140px] inline-block">
                                {asset.penggunaan_kib || "-"}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className="text-xs text-text-secondary">
                                {asset.kw || "-"}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-right whitespace-nowrap">
                              <span className="text-sm text-text-secondary tabular-nums">
                                {asset.harga_perolehan
                                  ? formatCurrency(asset.harga_perolehan)
                                  : "-"}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-right whitespace-nowrap">
                              <span className="text-sm font-medium text-text-secondary tabular-nums">
                                {asset.nilai_aset
                                  ? formatCurrency(asset.nilai_aset)
                                  : "-"}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              {isAssetCertified(asset) ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                                  Bersertifikat
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-text-muted border border-border text-[10px] font-bold">
                                  Belum
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              <span
                                className={`text-xs font-medium ${asset.plotting_status === "ok" ? "text-emerald-600 dark:text-emerald-400" : "text-text-muted"}`}
                              >
                                {asset.plotting_status || "-"}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              {asset.status_sewa === "Tersewa" ? (
                                <div>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700">
                                    <HandshakeIcon size={12} weight="fill" />
                                    Tersewa
                                  </span>
                                  {asset.penyewa_aktif && (
                                    <p
                                      className="text-[10px] text-text-muted mt-0.5 truncate max-w-[100px]"
                                      title={asset.penyewa_aktif}
                                    >
                                      {asset.penyewa_aktif}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-surface-secondary text-text-muted border border-border">
                                  Tidak Tersewa
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {hasCoords ? (
                                <button
                                  onClick={() => handleShowOnMap(asset)}
                                  className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors cursor-pointer"
                                  title="Lihat di peta"
                                >
                                  <MapPinIcon size={14} weight="fill" />
                                </button>
                              ) : (
                                <span
                                  className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gray-50 dark:bg-gray-500/10 text-gray-400"
                                  title="Belum ada koordinat"
                                >
                                  <MapPinIcon size={14} />
                                </span>
                              )}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-3 py-3">
                              <div className="flex flex-col items-start gap-1">
                                <span className="inline-flex max-w-full truncate rounded-md border border-border bg-surface-secondary px-2 py-1 font-mono text-[11px] font-bold text-text-primary">
                                  {asset.kode_aset}
                                </span>
                                {asset.kode_2d && <span className="px-1 font-mono text-[8px] font-bold text-accent">{asset.kode_2d}</span>}
                              </div>
                            </td>
                            <td className="px-2.5 py-2">
                              <p className="line-clamp-1 text-xs font-semibold leading-4 text-text-primary">
                                {asset.nama_aset}
                              </p>
                              {asset.tahun_perolehan && (
                                <span className="mt-0.5 inline-flex rounded-md bg-surface-secondary px-1.5 py-0.5 text-[8px] font-semibold text-text-muted">
                                  Perolehan {asset.tahun_perolehan}
                                </span>
                              )}
                            </td>
                            <td className="px-2.5 py-2">
                              <div className="flex min-w-0 items-center gap-1.5">
                                <MapPinIcon
                                  size={15}
                                  weight={hasCoords ? "fill" : "regular"}
                                  className={
                                    hasCoords
                                      ? "shrink-0 text-emerald-500"
                                      : "shrink-0 text-text-muted"
                                  }
                                />
                                <div className="min-w-0">
                                  <p
                                    className="truncate text-[11px] leading-4 text-text-secondary"
                                    title={asset.lokasi}
                                  >
                                    {asset.lokasi || "Alamat belum diisi"}
                                  </p>
                                  <p className="mt-0.5 truncate text-[9px] text-text-muted">
                                    {[asset.desa_kelurahan, asset.kecamatan]
                                      .filter(Boolean)
                                      .join(", ") || "-"}
                                  </p>
                                </div>
                                {hasCoords && (
                                  <button
                                    type="button"
                                    onClick={() => handleShowOnMap(asset)}
                                    title={`Lihat ${asset.nama_aset} di peta`}
                                    aria-label={`Lihat ${asset.nama_aset} di peta`}
                                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-accent transition hover:border-accent/50 hover:bg-accent/15 focus-visible:ring-2 focus-visible:ring-accent"
                                  >
                                    <NavigationArrowIcon
                                      size={12}
                                      weight="bold"
                                    />
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="hidden">
                              <span className="text-sm text-text-secondary whitespace-nowrap">
                                {asset.kecamatan || "-"}
                              </span>
                            </td>
                            <td className="hidden">
                              <span className="text-sm text-text-secondary whitespace-nowrap">
                                {asset.desa_kelurahan || "-"}
                              </span>
                            </td>
                            <td className="px-2.5 py-2 text-right">
                              <p className="text-sm font-bold tabular-nums text-text-primary">
                                {asset.luas
                                  ? formatNumber(Number(asset.luas))
                                  : "-"}
                              </p>
                              <span className="text-[10px] font-medium text-text-muted">
                                m²
                              </span>
                            </td>
                            <td className="px-2.5 py-2">
                              <span
                                className={`inline-flex rounded-md border px-1.5 py-0.5 text-[9px] font-bold ${
                                  isAssetCertified(asset)
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                                    : "border-border bg-surface-secondary text-text-muted"
                                }`}
                              >
                                {isAssetCertified(asset)
                                  ? "Bersertifikat"
                                  : "Belum bersertifikat"}
                              </span>
                              <p className="mt-1 truncate text-[11px] font-semibold text-text-secondary">
                                {asset.jenis_hak || "Hak belum diisi"}
                              </p>
                              <p
                                className="truncate font-mono text-[9px] text-text-muted"
                                title={asset.nomor_sertifikat}
                              >
                                {asset.nomor_sertifikat || "-"}
                              </p>
                            </td>
                            <td className="hidden">
                              <span className="text-sm font-mono text-text-primary">
                                {asset.nomor_sertifikat || "-"}
                              </span>
                            </td>
                            <td className="hidden">
                              <span className="text-xs font-medium text-text-secondary whitespace-nowrap">
                                {asset.kw || "-"}
                              </span>
                            </td>
                            <td className="px-2.5 py-2 text-right whitespace-nowrap">
                              <span className="text-xs font-semibold text-text-primary tabular-nums">
                                {asset.nilai_aset
                                  ? formatCurrency(asset.nilai_aset)
                                  : "-"}
                              </span>
                            </td>
                            <td className="hidden">
                              {isAssetCertified(asset) ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                                  Bersertifikat
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-text-muted border border-border text-[10px] font-bold">
                                  Belum
                                </span>
                              )}
                            </td>
                            <td className="hidden">
                              <span
                                className={`text-xs font-medium ${
                                  asset.plotting_status === "ok" ||
                                  asset.polygon_bidang
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-text-muted"
                                }`}
                              >
                                {asset.plotting_status ||
                                  (asset.polygon_bidang ? "ok" : "-")}
                              </span>
                            </td>
                            <td className="px-2.5 py-2">
                              <span
                                className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-bold ${
                                  asset.status_sewa === "Tersewa"
                                    ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                    : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                                }`}
                              >
                                <HandshakeIcon size={11} weight="fill" />
                                {asset.status_sewa === "Tersewa"
                                  ? "Tersewa"
                                  : "Tidak tersewa"}
                              </span>
                              <p
                                className="mt-1 truncate text-[10px] leading-4 text-text-secondary"
                                title={asset.opd_pengguna}
                              >
                                {asset.opd_pengguna || "Belum ada OPD pengguna"}
                              </p>
                            </td>
                            <td className="hidden">
                              <div className="flex items-center justify-center gap-1">
                                <CalendarIcon
                                  size={14}
                                  className="text-text-muted"
                                />
                                <span className="text-sm text-text-secondary">
                                  {asset.tahun_perolehan || "-"}
                                </span>
                              </div>
                            </td>
                          </>
                        )}

                        {/* Sticky Aksi Column */}
                        <td
                          className={`sticky right-0 z-20 w-[184px] border-l border-border/50 px-2.5 py-2 transition-colors ${
                            isHovered
                              ? "bg-accent/5 dark:bg-accent/10"
                              : "bg-surface"
                          }`}
                        >
                          <div
                            className={`transition-all duration-200 ${
                              isHovered ? "opacity-100" : "opacity-70"
                            }`}
                          >
                            <ActionButtons
                              assetId={asset.id_aset}
                              asset={asset}
                              onEdit={
                                canUpdate
                                  ? (id) => handleOpenEditForm(id)
                                  : null
                              }
                              onView={() => handleViewAsset(asset.id_aset)}
                              onDelete={
                                canDelete ? (id) => handleDeleteAsset(id) : null
                              }
                              onDownloadPdf={handleDownloadAssetPdf}
                              onDownloadGeojson={handleDownloadAssetGeojson}
                              showEdit={canUpdate}
                              showDelete={canDelete}
                              catalogStyle
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="divide-y divide-border xl:hidden">
              {sortedAssets.map((asset, idx) => {
                const hasCoords = asset.koordinat_lat && asset.koordinat_long;
                const rowNumber = (currentPage - 1) * itemsPerPage + idx + 1;

                return (
                  <div key={asset.id_aset} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-surface">
                            {rowNumber}
                          </span>
                          {useCompactAssetTable ? (
                            <span className="text-xs font-semibold text-text-primary">
                              {asset.desa_kelurahan || "-"}
                            </span>
                          ) : (
                            <div className="flex flex-col items-start gap-0.5">
                              <span className="text-xs font-mono font-semibold text-text-muted bg-surface-secondary px-2 py-0.5 rounded">
                                {asset.kode_aset}
                              </span>
                              {asset.kode_2d && <span className="px-1 font-mono text-[8px] font-bold text-accent">{asset.kode_2d}</span>}
                            </div>
                          )}
                          {useCompactAssetTable && hasCoords && (
                            <MapPinIcon
                              size={12}
                              weight="fill"
                              className="text-emerald-500"
                            />
                          )}
                        </div>
                        <p className="text-sm font-semibold text-text-primary line-clamp-1">
                          {useCompactAssetTable
                            ? `${asset.jenis_hak || "Tanah"} No.${asset.nomor_sertifikat || "?"}`
                            : asset.nama_aset}
                        </p>
                      </div>
                      <ActionButtons
                        assetId={asset.id_aset}
                        asset={asset}
                        onEdit={
                          canUpdate ? (id) => handleOpenEditForm(id) : null
                        }
                        onView={() => handleViewAsset(asset.id_aset)}
                        onDelete={
                          canDelete ? (id) => handleDeleteAsset(id) : null
                        }
                        onDownloadPdf={handleDownloadAssetPdf}
                        onDownloadGeojson={handleDownloadAssetGeojson}
                        showEdit={canUpdate}
                        showDelete={canDelete}
                        catalogStyle
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {useCompactAssetTable ? (
                        <>
                          <div>
                            <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-0.5">
                              Luas (m²)
                            </p>
                            <p className="text-xs text-text-secondary">
                              {asset.luas
                                ? formatNumber(Number(asset.luas))
                                : "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-0.5">
                              UPT / OPD
                            </p>
                            <p className="text-xs text-text-secondary line-clamp-1">
                              {asset.opd_pengguna || "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-0.5">
                              Nilai Aset
                            </p>
                            <p className="text-xs text-text-secondary">
                              {asset.nilai_aset
                                ? formatCurrency(asset.nilai_aset)
                                : "-"}
                            </p>
                          </div>
                          {asset.nibar && (
                            <div className="col-span-2">
                              <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-0.5">
                                NIBAR
                              </p>
                              <p className="text-[10px] font-mono text-text-muted break-all">
                                {asset.nibar}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="col-span-2 rounded-lg bg-surface-secondary p-2.5">
                            <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-text-muted">
                              Lokasi
                            </p>
                            <p className="line-clamp-2 text-xs text-text-secondary">
                              {asset.lokasi || "Alamat belum diisi"}
                            </p>
                            <p className="mt-1 text-[10px] text-text-muted">
                              {[asset.desa_kelurahan, asset.kecamatan]
                                .filter(Boolean)
                                .join(", ") || "-"}
                            </p>
                          </div>
                          <div>
                            <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wider text-text-muted">
                              Luas
                            </p>
                            <p className="text-xs font-semibold text-text-primary">
                              {asset.luas
                                ? `${formatNumber(Number(asset.luas))} m²`
                                : "-"}
                            </p>
                          </div>
                          <div>
                            <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wider text-text-muted">
                              Nilai
                            </p>
                            <p className="text-xs font-semibold text-text-primary">
                              {asset.nilai_aset
                                ? formatCurrency(asset.nilai_aset)
                                : "-"}
                            </p>
                          </div>
                          <div className="col-span-2 flex flex-wrap gap-1.5 pt-1">
                            <span
                              className={`rounded-md border px-2 py-1 text-[9px] font-bold ${
                                isAssetCertified(asset)
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                                  : "border-border bg-surface-secondary text-text-muted"
                              }`}
                            >
                              {isAssetCertified(asset)
                                ? "Bersertifikat"
                                : "Belum bersertifikat"}
                            </span>
                            <span
                              className={`rounded-md border px-2 py-1 text-[9px] font-bold ${
                                asset.status_sewa === "Tersewa"
                                  ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                              }`}
                            >
                              {asset.status_sewa === "Tersewa"
                                ? "Tersewa"
                                : "Tidak tersewa"}
                            </span>
                            {hasCoords && (
                              <button
                                type="button"
                                onClick={() => handleShowOnMap(asset)}
                                title={`Lihat ${asset.nama_aset} di peta`}
                                aria-label={`Lihat ${asset.nama_aset} di peta`}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-accent/30 bg-accent/10 text-accent"
                              >
                                <NavigationArrowIcon size={12} weight="bold" />
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
        {totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            pageSizeOptions={[10, 20, 50]}
            embedded
            itemLabel="aset"
          />
        )}
      </div>

      {/* View Modal */}
      <AssetViewModal
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        asset={viewingAsset}
        onEdit={canUpdate ? handleOpenEditForm : null}
        canEdit={canUpdate}
        canDelete={canDelete}
        onDownloadPdf={handleDownloadAssetPdf}
        onDownloadGeojson={handleDownloadAssetGeojson}
      />
    </div>
  );
}
