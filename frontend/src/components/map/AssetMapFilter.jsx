import LegacyMapFilter, { MapAssetStats as LegacyMapAssetStats } from "./bpn/MapFilter";

/**
 * Filter peta untuk master aset terpadu. Adaptasi properti legacy disimpan
 * di sini agar halaman peta tidak lagi mengetahui mode institusi lama.
 */
export default function AssetMapFilter(props) {
  return <LegacyMapFilter {...props} isBPKAMode />;
}

export function MapAssetStats({ assets = [] }) {
  return <LegacyMapAssetStats assets={assets} isBPKAMode={false} />;
}
