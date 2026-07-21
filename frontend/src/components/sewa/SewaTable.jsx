import { useState } from "react";
import {
  PencilSimpleIcon,
  TrashIcon,
  EyeIcon,
  ArrowUUpLeftIcon,
  CaretUpDownIcon,
  CaretUpIcon,
  CaretDownIcon,
  CheckCircleIcon,
  WarningIcon,
  XCircleIcon,
  ProhibitIcon,
  PackageIcon,
} from "@phosphor-icons/react";

const getStatusConfig = (status) => {
  const configs = {
    Disewakan: {
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      text: "text-emerald-700 dark:text-emerald-400",
      border: "border-emerald-200 dark:border-emerald-500/20",
      icon: CheckCircleIcon,
    },
    "Akan Berakhir": {
      bg: "bg-amber-50 dark:bg-amber-500/10",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-500/20",
      icon: WarningIcon,
    },
    Berakhir: {
      bg: "bg-red-50 dark:bg-red-500/10",
      text: "text-red-700 dark:text-red-400",
      border: "border-red-200 dark:border-red-500/20",
      icon: XCircleIcon,
    },
    Dikembalikan: {
      bg: "bg-blue-50 dark:bg-blue-500/10",
      text: "text-blue-700 dark:text-blue-400",
      border: "border-blue-200 dark:border-blue-500/20",
      icon: ArrowUUpLeftIcon,
    },
    Dibatalkan: {
      bg: "bg-surface-tertiary",
      text: "text-text-muted",
      border: "border-border",
      icon: ProhibitIcon,
    },
  };
  return (
    configs[status] || {
      bg: "bg-surface-tertiary",
      text: "text-text-muted",
      border: "border-border",
      icon: ProhibitIcon,
    }
  );
};

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(num) {
  if (!num) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);
}

const SortIcon = ({ column, sortBy, sortOrder }) => {
  if (sortBy !== column)
    return <CaretUpDownIcon size={14} className="text-text-muted" />;
  return sortOrder === "asc" ? (
    <CaretUpIcon size={14} weight="bold" className="text-accent" />
  ) : (
    <CaretDownIcon size={14} weight="bold" className="text-accent" />
  );
};

export default function SewaTable({
  data = [],
  onEdit,
  onDelete,
  onView,
  onReturn,
  sortBy,
  sortOrder,
  onSort,
}) {
  const [hoveredRow, setHoveredRow] = useState(null);

  if (data.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-20 h-20 bg-surface-secondary rounded-2xl flex items-center justify-center mx-auto mb-6">
          <PackageIcon size={40} weight="duotone" className="text-text-muted" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          Belum ada data penyewaan
        </h3>
        <p className="text-text-muted text-sm max-w-sm mx-auto">
          Klik tombol &quot;Tambah Penyewaan&quot; untuk menambahkan data
        </p>
      </div>
    );
  }

  const ThSortable = ({ column, children, className = "" }) => (
    <th
      className={`px-4 py-4 text-left text-[11px] font-semibold text-text-muted uppercase tracking-wider cursor-pointer select-none hover:text-text-secondary transition-colors ${className}`}
      onClick={() => onSort(column)}
    >
      <span className="flex items-center gap-1">
        {children}
        <SortIcon column={column} sortBy={sortBy} sortOrder={sortOrder} />
      </span>
    </th>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead>
          <tr className="bg-linear-to-r from-surface-secondary to-surface border-b border-border">
            <th className="px-4 py-4 text-left text-[11px] font-semibold text-text-muted uppercase tracking-wider w-12">
              No
            </th>
            <ThSortable column="nama_aset" className="min-w-[160px]">
              Aset
            </ThSortable>
            <ThSortable column="nama_penyewa" className="min-w-[140px]">
              Penyewa
            </ThSortable>
            <ThSortable column="tanggal_mulai" className="min-w-[160px]">
              Periode
            </ThSortable>
            <ThSortable column="nilai_sewa" className="min-w-[120px]">
              Nilai Sewa
            </ThSortable>
            <ThSortable column="status" className="min-w-[120px]">
              Status
            </ThSortable>
            <th className="px-4 py-4 text-center text-[11px] font-semibold text-text-muted uppercase tracking-wider w-32">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((item, idx) => {
            const statusConfig = getStatusConfig(item.status);
            const StatusIcon = statusConfig.icon;
            return (
              <tr
                key={item.id_sewa}
                className={`transition-colors ${
                  hoveredRow === item.id_sewa
                    ? "bg-accent/5 dark:bg-accent/10"
                    : ""
                }`}
                onMouseEnter={() => setHoveredRow(item.id_sewa)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <td className="px-4 py-3.5 text-sm text-text-muted">
                  {idx + 1}
                </td>
                <td className="px-4 py-3.5">
                  <div className="text-sm font-medium text-text-primary">
                    {item.nama_aset}
                  </div>
                  {item.lokasi_aset && (
                    <div className="text-xs text-text-muted truncate max-w-[200px]">
                      {item.lokasi_aset}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <div className="text-sm font-medium text-text-primary">
                    {item.nama_penyewa}
                  </div>
                  {item.instansi_penyewa && (
                    <div className="text-xs text-text-muted">
                      {item.instansi_penyewa}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3.5 text-sm text-text-secondary">
                  {formatDate(item.tanggal_mulai)} –{" "}
                  {formatDate(item.tanggal_berakhir)}
                </td>
                <td className="px-4 py-3.5 text-sm font-medium text-text-primary">
                  {formatCurrency(item.nilai_sewa)}
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                  >
                    <StatusIcon size={13} weight="bold" />
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-center gap-0.5">
                    <button
                      onClick={() => onView(item)}
                      className="p-1.5 text-text-muted hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Lihat detail"
                    >
                      <EyeIcon size={18} weight="bold" />
                    </button>
                    <button
                      onClick={() => onEdit(item)}
                      className="p-1.5 text-text-muted hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <PencilSimpleIcon size={18} weight="bold" />
                    </button>
                    {item.status === "Disewakan" && onReturn && (
                      <button
                        onClick={() => onReturn(item)}
                        className="p-1.5 text-text-muted hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                        title="Proses Pengembalian"
                      >
                        <ArrowUUpLeftIcon size={18} weight="bold" />
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(item)}
                      className="p-1.5 text-text-muted hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <TrashIcon size={18} weight="bold" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
