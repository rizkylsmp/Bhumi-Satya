import DashboardBPNPanel from "./DashboardBPNPanel";

/**
 * Panel statistik terpadu untuk seluruh pengguna internal.
 * Komponen presentasi lama dipakai ulang selama konsolidasi UI bertahap.
 */
export default function DashboardIntegratedPanel(props) {
  return <DashboardBPNPanel {...props} />;
}
