import MapDisplayBPN from "./bpn/MapDisplayBPN";

/**
 * Peta master aset terpadu. Marker dan polygon aset diterima dari API;
 * GeoJSON lokal hanya digunakan oleh layer referensi non-aset.
 */
export default function AssetMapDisplay(props) {
  return <MapDisplayBPN {...props} />;
}
