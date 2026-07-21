import {
  ChartLineUpIcon,
  CurrencyCircleDollarIcon,
  CalendarCheckIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";

export default function PenilaianAsetPage() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-linear-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
          <ChartLineUpIcon size={24} weight="fill" className="text-surface" />
        </div>
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-text-primary">
            Penilaian Aset
          </h1>
          <p className="text-sm text-text-secondary">
            Kelola data penilaian aset tanah
          </p>
        </div>
      </div>

      {/* Placeholder Content */}
      <div className="bg-surface border border-border rounded-2xl p-8 lg:p-12">
        <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-violet-50 dark:bg-violet-900/20 rounded-2xl flex items-center justify-center mb-6">
            <ChartLineUpIcon size={40} weight="duotone" className="text-violet-500" />
          </div>
          <h2 className="text-lg font-bold text-text-primary mb-2">
            Fitur Penilaian Aset
          </h2>
          <p className="text-sm text-text-secondary mb-8">
            Halaman ini akan digunakan untuk mengelola data penilaian aset tanah
            termasuk nilai pasar, NJOP, metode penilaian, dan dokumen hasil penilaian.
          </p>

          {/* Feature preview cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            {[
              { icon: CurrencyCircleDollarIcon, label: "Nilai Pasar", desc: "Estimasi nilai aset" },
              { icon: ChartLineUpIcon, label: "Nilai NJOP", desc: "Nilai objek pajak" },
              { icon: CalendarCheckIcon, label: "Tanggal Penilaian", desc: "Riwayat penilaian" },
              { icon: UserCircleIcon, label: "Penilai", desc: "Nama & instansi penilai" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 p-3 bg-surface-secondary border border-border rounded-xl text-left"
              >
                <div className="w-9 h-9 bg-violet-50 dark:bg-violet-900/20 rounded-lg flex items-center justify-center shrink-0">
                  <item.icon size={18} weight="bold" className="text-violet-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{item.label}</p>
                  <p className="text-xs text-text-muted">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
              🚧 Fitur ini sedang dalam pengembangan
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
