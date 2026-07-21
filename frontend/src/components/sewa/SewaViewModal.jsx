import {
  XIcon,
  CheckCircleIcon,
  WarningIcon,
  XCircleIcon,
  ArrowUUpLeftIcon,
  ProhibitIcon,
} from "@phosphor-icons/react";

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
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

const getStatusConfig = (status) => {
  const configs = {
    Aktif: {
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

// Field component moved outside to prevent re-creation on every render
const Field = ({ label, value }) => (
  <div>
    <dt className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
      {label}
    </dt>
    <dd className="mt-1 text-sm text-text-primary">{value || "-"}</dd>
  </div>
);

export default function SewaViewModal({ isOpen, onClose, data }) {
  if (!isOpen || !data) return null;

  const statusConfig = getStatusConfig(data.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-surface rounded-t-2xl z-10">
          <h2 className="text-lg font-semibold text-text-primary">
            Detail Penyewaan
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
          >
            <XIcon size={20} className="text-text-muted" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-muted">Status:</span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
            >
              <StatusIcon size={14} weight="bold" />
              {data.status}
            </span>
          </div>

          {/* Informasi Aset */}
          <div>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 pb-2 border-b border-border">
              Informasi Aset
            </h3>
            <dl className="grid grid-cols-2 gap-4">
              <Field label="Nama Aset" value={data.nama_aset} />
              <Field label="Lokasi" value={data.lokasi_aset} />
            </dl>
          </div>

          {/* Informasi Penyewa */}
          <div>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 pb-2 border-b border-border">
              Informasi Penyewa
            </h3>
            <dl className="grid grid-cols-2 gap-4">
              <Field label="Nama Penyewa" value={data.nama_penyewa} />
              <Field label="NIK" value={data.nik_penyewa} />
              <Field label="Instansi" value={data.instansi_penyewa} />
              <Field label="Telepon" value={data.telepon_penyewa} />
              <Field label="Email" value={data.email_penyewa} />
              <Field label="Alamat" value={data.alamat_penyewa} />
            </dl>
          </div>

          {/* Periode & Nilai */}
          <div>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 pb-2 border-b border-border">
              Periode & Nilai Sewa
            </h3>
            <dl className="grid grid-cols-2 gap-4">
              <Field
                label="Tanggal Mulai"
                value={formatDate(data.tanggal_mulai)}
              />
              <Field
                label="Tanggal Berakhir"
                value={formatDate(data.tanggal_berakhir)}
              />
              <Field
                label="Nilai Sewa"
                value={formatCurrency(data.nilai_sewa)}
              />
              <Field label="Periode Bayar" value={data.periode_bayar} />
              <Field label="Nomor Kontrak" value={data.nomor_kontrak} />
            </dl>
          </div>

          {/* Pengembalian */}
          {data.status === "Dikembalikan" && (
            <div>
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 pb-2 border-b border-border">
                Informasi Pengembalian
              </h3>
              <dl className="grid grid-cols-2 gap-4">
                <Field
                  label="Tanggal Pengembalian"
                  value={formatDate(data.tanggal_pengembalian)}
                />
                <Field label="Kondisi" value={data.kondisi_pengembalian} />
                <div className="col-span-2">
                  <Field
                    label="Catatan Pengembalian"
                    value={data.catatan_pengembalian}
                  />
                </div>
              </dl>

              {/* Foto Kondisi */}
              {data.foto_kondisi && data.foto_kondisi.length > 0 && (
                <div className="mt-4">
                  <dt className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2">
                    Foto Kondisi Aset
                  </dt>
                  <div className="grid grid-cols-3 gap-2">
                    {data.foto_kondisi.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg overflow-hidden border border-border hover:border-accent transition-colors"
                      >
                        <img
                          src={url}
                          alt={`Kondisi ${idx + 1}`}
                          className="w-full h-24 object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Catatan */}
          {data.catatan && (
            <div>
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 pb-2 border-b border-border">
                Catatan
              </h3>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">
                {data.catatan}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-text-secondary bg-surface-secondary hover:bg-surface-tertiary rounded-xl transition-colors border border-border"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
