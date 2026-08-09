import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import AssetMapDisplay from "../components/map/AssetMapDisplay";
import AssetMapFilter from "../components/map/AssetMapFilter";
import AssetLayerControl from "../components/map/AssetLayerControl";
import AssetViewModal from "../components/asset/AssetViewModal";
import AssetDetailPanel from "../components/map/shared/AssetDetailPanel";
import MapSearchOverlay from "../components/map/bpn/MapSearchOverlay";
import { petaService, asetService } from "../services/api";
import { downloadAssetPdf } from "../utils/pdfExport";
import { downloadAssetGeojson } from "../utils/geojsonExport";
import { normalizeMapMarkers } from "../utils/mapAssets";
import { searchMapRecords } from "../utils/mapSearch";
import { RENTAL_FEATURE_ENABLED } from "../config/featureFlags";
import {
  CaretDownIcon,
  MapTrifoldIcon,
  StackIcon,
  XIcon,
} from "@phosphor-icons/react";

const TEAM_MEMBERS = [
  "Fikry Satrio",
  "M. Zaky Fahlevy",
  "Rizky Lanang Sadana Mulyono Putra",
];

function DropdownSection({ id, label, open, onToggle, children }) {
  return (
    <section className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`map-control-${id}`}
        className={`flex min-h-10 w-full items-center justify-between gap-3 px-3.5 py-2 text-left text-[9px] font-extrabold uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
          open
            ? "bg-surface-secondary text-text-primary"
            : "bg-surface text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
        }`}
      >
        <span>{label}</span>
        <CaretDownIcon
          size={13}
          weight="bold"
          className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          id={`map-control-${id}`}
          className="border-t border-border bg-surface p-2.5"
        >
          {children}
        </div>
      )}
    </section>
  );
}

function hasCoordinatePair(latitude, longitude) {
  return (
    Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))
  );
}

function hasPolygonCoordinates(value) {
  if (!value) return false;

  if (typeof value === "string") {
    try {
      return hasPolygonCoordinates(JSON.parse(value));
    } catch {
      return false;
    }
  }

  if (Array.isArray(value)) {
    const [first, second] = value;
    if (hasCoordinatePair(first, second)) return true;
    return value.some((item) => hasPolygonCoordinates(item));
  }

  if (typeof value === "object") {
    if (hasCoordinatePair(value.lat, value.lng)) return true;
    if (hasCoordinatePair(value.latitude, value.longitude)) return true;
    return ["coordinates", "geometry", "features"].some((key) =>
      hasPolygonCoordinates(value[key]),
    );
  }

  return false;
}

function hasMapGeometry(asset) {
  return (
    hasCoordinatePair(asset?.latitude, asset?.longitude) ||
    hasPolygonCoordinates(asset?.polygon)
  );
}

function hasCertificate(asset) {
  const status = String(asset?.status_sertifikat || "").toLowerCase();
  if (status.includes("belum")) return false;
  if (status.includes("telah") || status.includes("sudah")) return true;
  return String(asset?.nomor_sertifikat || "").trim().length > 10;
}

function MapData2dControls({
  filteredAssets,
  selectedKecamatanFilter,
  setSelectedKecamatanFilter,
  selectedSewaLayers,
  handleSewaLayerToggle,
  handleSearch,
  handleSelectSearchAsset,
  assets,
  searchFilter,
  mapSearchResults,
  isMapSearchLoading,
  activeLayer,
  setActiveLayer,
  showKelurahan,
  setShowKelurahan,
  showKecamatan,
  setShowKecamatan,
  showSudahSertifikat,
  setShowSudahSertifikat,
  showBelumSertifikat,
  setShowBelumSertifikat,
  layerOnly = false,
  searchControlOnly = false,
}) {
  const [openSection, setOpenSection] = useState("layer");
  const toggleSection = (id) => {
    setOpenSection((current) => (current === id ? null : id));
  };

  if (searchControlOnly) {
    return (
      <AssetMapFilter
        searchOnly
        selectedSewaLayers={selectedSewaLayers}
        onSewaLayerToggle={handleSewaLayerToggle}
        onSearch={handleSearch}
        onSelectAsset={handleSelectSearchAsset}
        assets={assets}
        searchResults={searchFilter.trim().length >= 2 ? mapSearchResults : null}
        searchLoading={isMapSearchLoading}
        showStatistics={false}
      />
    );
  }

  if (layerOnly) {
    return (
      <AssetLayerControl
        embedded
        activeLayer={activeLayer}
        setActiveLayer={setActiveLayer}
        bidangLabel="Bidang Tanah"
        showKelurahan={showKelurahan}
        setShowKelurahan={setShowKelurahan}
        showKecamatan={showKecamatan}
        setShowKecamatan={setShowKecamatan}
        showSudahSertifikat={showSudahSertifikat}
        setShowSudahSertifikat={setShowSudahSertifikat}
        showBelumSertifikat={showBelumSertifikat}
        setShowBelumSertifikat={setShowBelumSertifikat}
      />
    );
  }

  return (
    <div className="overflow-hidden">
      <div
        className="flex min-h-11 items-center justify-between gap-2 border-b border-border bg-surface px-3.5"
        role="status"
        aria-live="polite"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
          <span className="text-xs font-bold text-text-primary">
            {filteredAssets.length}
          </span>
          <span className="truncate text-[9px] font-semibold text-text-muted">
            data tampil
          </span>
        </span>
        {selectedKecamatanFilter && (
          <button
            type="button"
            onClick={() => setSelectedKecamatanFilter("")}
            className="shrink-0 rounded-md border border-border px-2 py-1 text-[9px] font-bold text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary"
          >
            Reset wilayah
          </button>
        )}
      </div>

      <DropdownSection
        id="layer"
        label="Layer Peta"
        open={openSection === "layer"}
        onToggle={() => toggleSection("layer")}
      >
        <AssetLayerControl
          embedded
          activeLayer={activeLayer}
          setActiveLayer={setActiveLayer}
          panelTitle="Kontrol Layer"
          bidangLabel="Bidang Tanah"
          showKelurahan={showKelurahan}
          setShowKelurahan={setShowKelurahan}
          showKecamatan={showKecamatan}
          setShowKecamatan={setShowKecamatan}
          showSudahSertifikat={showSudahSertifikat}
          setShowSudahSertifikat={setShowSudahSertifikat}
          showBelumSertifikat={showBelumSertifikat}
          setShowBelumSertifikat={setShowBelumSertifikat}
        />
      </DropdownSection>

      {RENTAL_FEATURE_ENABLED && (
        <DropdownSection
          id="selection"
          label="Filter Penyewaan"
          open={openSection === "selection"}
          onToggle={() => toggleSection("selection")}
        >
          <AssetMapFilter
            hideSearch
            selectedSewaLayers={selectedSewaLayers}
            onSewaLayerToggle={handleSewaLayerToggle}
            onSearch={handleSearch}
            onSelectAsset={handleSelectSearchAsset}
            assets={assets}
            searchResults={searchFilter.trim().length >= 2 ? mapSearchResults : null}
            searchLoading={isMapSearchLoading}
            showStatistics={false}
          />
        </DropdownSection>
      )}

      <DropdownSection
        id="information"
        label="Informasi"
        open={openSection === "information"}
        onToggle={() => toggleSection("information")}
      >
        <div className="px-1 py-0.5">
          <p className="text-[8px] font-extrabold uppercase tracking-[0.14em] text-text-muted">
            Team
          </p>
          <ul className="mt-2 space-y-1.5">
            {TEAM_MEMBERS.map((member) => (
              <li
                key={member}
                className="flex items-start gap-2 text-[9px] leading-relaxed text-text-secondary"
              >
                <span
                  className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent/60"
                  aria-hidden="true"
                />
                <span>{member}</span>
              </li>
            ))}
          </ul>
        </div>
      </DropdownSection>
    </div>
  );
}

export default function MapPage({ publicMode = false }) {
  const location = useLocation();
  const navHighlightAssetId = location.state?.highlightAssetId || null;
  const navKecamatanFilter = location.state?.filterKecamatan || "";
  const initialAsset3dMode = location.state?.mapMode !== "2d";
  const navHighlightRequestKey = `${location.key || "default"}-${navHighlightAssetId || "none"}`;

  // Search-triggered flyTo
  const [focusAssetId, setFocusAssetId] = useState(null);
  const [focusKey, setFocusKey] = useState(0);
  const [focus3dTarget, setFocus3dTarget] = useState(null);
  const [focus3dKey, setFocus3dKey] = useState(null);
  const [temporarySearchAsset, setTemporarySearchAsset] = useState(null);
  const [mapSearchResults, setMapSearchResults] = useState([]);
  const [isMapSearchLoading, setIsMapSearchLoading] = useState(false);

  // Merge: search focus takes priority over navigation highlight
  const effectiveHighlightId = focusAssetId || navHighlightAssetId;
  const effectiveHighlightKey = focusAssetId
    ? `search-${focusKey}`
    : navHighlightRequestKey;

  const [showFilterPanel, setShowFilterPanel] = useState(true);
  const [sidePanelMode, setSidePanelMode] = useState(
    initialAsset3dMode ? "3d" : "map",
  );
  const [asset3dPanelContainer, setAsset3dPanelContainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState([]);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Sewa filter is off by default; active only after a status is selected.
  const [selectedSewaLayers, setSelectedSewaLayers] = useState({
    tersedia: false,
    tersewa: false,
  });

  const [detailAsset, setDetailAsset] = useState(null);
  const [selectedPanelAsset, setSelectedPanelAsset] = useState(null);
  const [mapSelectionClearKey, setMapSelectionClearKey] = useState(0);
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedKecamatanFilter, setSelectedKecamatanFilter] =
    useState(navKecamatanFilter);

  // Map control state lifted for the side panel.
  const [activeLayer, setActiveLayer] = useState("bidang");
  const [showMarkers, setShowMarkers] = useState(false);
  const [showPolygons, setShowPolygons] = useState(true);
  const [showKelurahan, setShowKelurahan] = useState(true);
  const [showKecamatan, setShowKecamatan] = useState(true);
  const [showSudahSertifikat, setShowSudahSertifikat] = useState(true);
  const [showBelumSertifikat, setShowBelumSertifikat] = useState(true);
  const handleAsset3dPanelOpenChange = useCallback((isOpen) => {
    setShowFilterPanel(isOpen);
  }, []);

  const handleAsset3dModeChange = useCallback((isEnabled) => {
    setSidePanelMode(isEnabled ? "3d" : "map");
    if (isEnabled) setShowFilterPanel(true);
  }, []);

  // Fetch markers from API
  const fetchMarkers = useCallback(async () => {
    setLoading(true);
    try {
      const response = publicMode
        ? await petaService.getPublicMarkers()
        : await petaService.getMarkers();
      const markers = response.data.data || [];

      // Transform to consistent format
      const transformedAssets = normalizeMapMarkers(markers);

      setAssets(transformedAssets);
    } catch (error) {
      console.error("Error fetching markers:", error);
      toast.error("Gagal memuat data peta");
    } finally {
      setLoading(false);
    }
  }, [publicMode]);

  useEffect(() => {
    fetchMarkers();
  }, [fetchMarkers]);

  useEffect(() => {
    if (!navKecamatanFilter) return;
    setSelectedKecamatanFilter(navKecamatanFilter);
    setShowFilterPanel(true);
    setActiveLayer("bidang");
    setShowPolygons(true);
  }, [navKecamatanFilter]);

  useEffect(() => {
    const term = searchFilter.trim();

    if (term.length < 2) {
      setMapSearchResults([]);
      setIsMapSearchLoading(false);
      return undefined;
    }

    const results = searchMapRecords(assets, term)
      .map((result) => result.record)
      .slice(0, 8);

    setMapSearchResults(results);
    setIsMapSearchLoading(false);
    return undefined;
  }, [assets, searchFilter]);

  // Fetch full asset detail
  const fetchAssetDetail = async (assetId) => {
    try {
      const response = publicMode
        ? await petaService.getPublicDetail(assetId)
        : await asetService.getById(assetId);
      if (response.data.success) {
        setDetailAsset((current) => ({
          ...current,
          ...response.data.data,
        }));
      }
    } catch (error) {
      console.error("Error fetching asset detail:", error);
      toast.error("Gagal memuat detail aset");
    }
  };

  const handleSewaLayerToggle = (layerId) => {
    setSelectedSewaLayers((prev) => ({
      ...prev,
      [layerId]: !prev[layerId],
    }));
  };

  const handleSearch = (term) => {
    setSearchFilter(term || "");
    // Search is handled internally by MapFilter dropdown — no map-level filter needed
  };

  const handleSelectSearchAsset = (asset, searchMode = "2d") => {
    setTemporarySearchAsset(asset);
    if (searchMode === "3d") {
      const selectedModel = asset.active_model_3d
        || asset.active_models_3d?.[0]
        || null;
      setFocus3dTarget({
        assetId: asset.id_aset || asset.id,
        modelId: selectedModel?.id_model_3d || null,
        kode3d: asset.kode_3d || selectedModel?.kode_3d || null,
      });
      setFocus3dKey((prev) => (prev ?? 0) + 1);
      setFocusAssetId(null);
      return;
    }

    setFocus3dTarget(null);
    setFocusAssetId(asset.id_aset || asset.id);
    setFocusKey((prev) => prev + 1);
  };

  const handleViewDetail = (asset) => {
    // Set partial data immediately so modal renders at once (no invisible flash)
    setDetailAsset({
      ...asset,
      id_aset: asset.id, // modal edit button uses id_aset
      tahun_perolehan: asset.tahun, // remap tahun → tahun_perolehan
    });
    setIsViewModalOpen(true);
    setSelectedPanelAsset(null);
    setMapSelectionClearKey((prev) => prev + 1);
    // Enrich with full data from backend in background.
    fetchAssetDetail(asset.id);
  };

  const handleCloseSelectedPanel = () => {
    setSelectedPanelAsset(null);
    setTemporarySearchAsset(null);
    setFocusAssetId(null);
    setFocus3dTarget(null);
    setMapSelectionClearKey((prev) => prev + 1);
  };

  const handleClearMapSelection = () => {
    setSelectedPanelAsset(null);
    setTemporarySearchAsset(null);
    setFocusAssetId(null);
    setFocus3dTarget(null);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setDetailAsset(null);
  };

  const handleDownloadAssetPdf = async (asset) => {
    if (publicMode) {
      await downloadAssetPdf(asset);
      return;
    }

    try {
      const assetId = asset?.id_aset || asset?.id;
      if (assetId) {
        const response = await asetService.getById(assetId);
        await downloadAssetPdf(response?.data?.data || asset);
        return;
      }
      await downloadAssetPdf(asset);
    } catch (error) {
      console.error("Error downloading asset PDF:", error);
      await downloadAssetPdf(asset);
    }
  };

  const handleDownloadAssetGeojson = async (asset) => {
    if (publicMode) {
      const downloaded = downloadAssetGeojson(asset);
      if (!downloaded) toast.error("Data polygon aset belum tersedia");
      return;
    }

    try {
      const assetId = asset?.id_aset || asset?.id;
      if (assetId) {
        const response = await asetService.getById(assetId);
        const downloaded = downloadAssetGeojson(response?.data?.data || asset);
        if (!downloaded) toast.error("Data polygon aset belum tersedia");
        return;
      }
      const downloaded = downloadAssetGeojson(asset);
      if (!downloaded) toast.error("Data polygon aset belum tersedia");
    } catch (error) {
      console.error("Error downloading asset GeoJSON:", error);
      const downloaded = downloadAssetGeojson(asset);
      if (!downloaded) toast.error("Data polygon aset belum tersedia");
    }
  };

  // Filter assets based on search and visible layer toggles.
  // NOTE: Search is NOT applied here — it only powers the dropdown/flyTo in MapFilter.
  const filteredAssets = useMemo(() => assets.filter((asset) => {
    // Filter berdasarkan status sewa.
    // When all sewa filters are off, show all Bidang Tanah instead of filtering
    // everything out.
    const isSewaFilterActive = Object.values(selectedSewaLayers).some(Boolean);
    const matchSewaLayer =
      !isSewaFilterActive ||
      (asset.status_sewa === "Tersedia" && selectedSewaLayers.tersedia) ||
      (asset.status_sewa === "Tersewa" && selectedSewaLayers.tersewa);
    const isCertified = hasCertificate(asset);
    const matchCertificateLayer =
      (showSudahSertifikat || !isCertified) &&
      (showBelumSertifikat || isCertified);
    const matchKecamatan =
      !selectedKecamatanFilter ||
      String(asset.kecamatan || "").trim().toLowerCase() ===
        String(selectedKecamatanFilter).trim().toLowerCase();
    return (
      matchSewaLayer &&
      matchCertificateLayer &&
      matchKecamatan
    );
  }), [
    assets,
    selectedKecamatanFilter,
    selectedSewaLayers,
    showBelumSertifikat,
    showSudahSertifikat,
  ]);

  const mapLookupAssets = useMemo(() => {
    const assetById = new Map();

    [...assets, ...mapSearchResults].forEach((asset) => {
      if (asset?.id === null || asset?.id === undefined) return;
      assetById.set(String(asset.id), asset);
    });

    return Array.from(assetById.values());
  }, [assets, mapSearchResults]);

  const displayedMapAssets = useMemo(() => {
    const assetById = new Map();

    filteredAssets.forEach((asset) => {
      if (asset?.id === null || asset?.id === undefined) return;
      assetById.set(String(asset.id), asset);
    });

    mapSearchResults.forEach((asset) => {
      if (asset?.id === null || asset?.id === undefined) return;
      if (!hasMapGeometry(asset)) return;
      assetById.set(String(asset.id), asset);
    });

    if (temporarySearchAsset) {
      const temporaryId = temporarySearchAsset.id_aset ?? temporarySearchAsset.id;
      if (temporaryId !== null && temporaryId !== undefined) {
        const key = String(temporaryId);
        if (!assetById.has(key) && hasMapGeometry(temporarySearchAsset)) {
          assetById.set(key, temporarySearchAsset);
        }
      }
    }

    return Array.from(assetById.values());
  }, [filteredAssets, mapSearchResults, temporarySearchAsset]);

  const data2dControlProps = {
    filteredAssets,
    selectedKecamatanFilter,
    setSelectedKecamatanFilter,
    selectedSewaLayers,
    handleSewaLayerToggle,
    handleSearch,
    handleSelectSearchAsset,
    assets,
    searchFilter,
    mapSearchResults,
    isMapSearchLoading,
    activeLayer,
    setActiveLayer,
    showKelurahan,
    setShowKelurahan,
    showKecamatan,
    setShowKecamatan,
    showSudahSertifikat,
    setShowSudahSertifikat,
    showBelumSertifikat,
    setShowBelumSertifikat,
  };

  return (
    <div className="flex h-full overflow-hidden bg-surface-secondary relative">
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-surface/90 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 p-8 bg-surface rounded-2xl border border-border shadow-xl">
            <div className="relative">
              <div className="animate-spin w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full"></div>
              <MapTrifoldIcon
                size={24}
                weight="fill"
                className="text-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              />
            </div>
            <span className="text-sm font-medium text-text-secondary">
              Memuat peta...
            </span>
          </div>
        </div>
      )}

      {/* Map Display - Full width */}
      <div
        id="map-fullscreen-container"
        className="flex-1 relative h-full overflow-hidden"
      >
        <AssetMapDisplay
          key={`digital-twin-${location.key}-${initialAsset3dMode ? "3d" : "2d"}`}
          assets={displayedMapAssets}
          allAssets={mapLookupAssets}
          mode="integrated"
          highlightAssetId={effectiveHighlightId}
          highlightRequestKey={effectiveHighlightKey}
          focus3dTarget={focus3dTarget}
          focus3dRequestKey={focus3dKey}
          initialAsset3dMode={initialAsset3dMode}
          asset3dPanelContainer={asset3dPanelContainer}
          asset3dPanelOpen={showFilterPanel && sidePanelMode === "3d"}
          asset2dPanelContent={
            <MapData2dControls {...data2dControlProps} layerOnly />
          }
          onAsset3dPanelOpenChange={handleAsset3dPanelOpenChange}
          onAsset3dModeChange={handleAsset3dModeChange}
          onFeatureClick={(asset) => setSelectedPanelAsset(asset)}
          onOtherLayerClick={handleClearMapSelection}
          clearSelectionKey={mapSelectionClearKey}
          popupSectionScope={publicMode ? "general" : "all"}
          showControls={false}
          activeLayer={activeLayer}
          showMarkers={showMarkers}
          setShowMarkers={setShowMarkers}
          showPolygons={showPolygons}
          setShowPolygons={setShowPolygons}
          showKelurahan={showKelurahan}
          showKecamatan={showKecamatan}
          showSudahSertifikat={showSudahSertifikat}
          showBelumSertifikat={showBelumSertifikat}
        />

        <div className="absolute left-4 top-4 z-[45] w-[min(19rem,calc(100vw-2rem))]">
          <MapSearchOverlay
            assets={assets}
            activeMapMode={sidePanelMode === "3d" ? "3d" : "2d"}
            onSelectAsset={handleSelectSearchAsset}
          />
        </div>

        {/* Filter Toggle Button — top-left */}
        {!showFilterPanel && (
          <button
            onClick={() => setShowFilterPanel(true)}
            className="group absolute left-4 top-[4.75rem] z-30 flex h-10 items-center gap-2 rounded-lg border border-border bg-surface/95 px-3 text-text-primary shadow-lg shadow-black/10 backdrop-blur-xl transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            aria-label="Buka menu peta"
          >
            <StackIcon size={16} weight="fill" />
            <span className="text-[10px] font-black uppercase tracking-[0.14em]">
              Menu Peta
            </span>
            {(searchFilter ||
              selectedKecamatanFilter ||
              Object.values(selectedSewaLayers).some(Boolean)) && (
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            )}
          </button>
        )}

        {/* Custom Asset Detail Panel */}
        {selectedPanelAsset && (
          <AssetDetailPanel
            key={selectedPanelAsset.id_aset || selectedPanelAsset.id}
            asset={selectedPanelAsset}
            onClose={handleCloseSelectedPanel}
            onViewDetail={publicMode ? null : handleViewDetail}
            showModel3d={sidePanelMode === "3d"}
            visibleSectionIds={
              publicMode ? ["general", "model3d", "land"] : null
            }
          />
        )}
      </div>

      {/* Side Panel — slides in from left */}
      <div
        className={`absolute left-4 top-[4.75rem] z-40 transition duration-200 ease-out ${
          showFilterPanel
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
        <div className="flex max-h-[calc(100vh-5.75rem)] w-[min(19rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-border bg-surface/95 shadow-xl shadow-black/15 backdrop-blur-xl">
          <div
            className={sidePanelMode === "3d" ? "hidden" : "contents"}
            aria-hidden={sidePanelMode === "3d"}
          >
            <div className="flex h-11 items-center justify-between border-b border-border bg-surface px-3">
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-text-primary">
                <StackIcon size={14} weight="fill" />
                Menu Peta
              </span>
              <button
                type="button"
                onClick={() => setShowFilterPanel(false)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-secondary hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent"
                aria-label="Tutup menu peta"
              >
                <XIcon size={14} weight="bold" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto dark:[color-scheme:dark]">
              <MapData2dControls {...data2dControlProps} />
            </div>
          </div>

          {sidePanelMode === "3d" && (
            <div ref={setAsset3dPanelContainer} className="h-full min-h-0" />
          )}
        </div>
      </div>

      {/* Asset View Modal */}
      <AssetViewModal
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        asset={detailAsset}
        canEdit={false}
        publicMode={publicMode}
        onDownloadPdf={handleDownloadAssetPdf}
        onDownloadGeojson={handleDownloadAssetGeojson}
      />
    </div>
  );
}
