import { useState } from "react";
import toast from "react-hot-toast";
import { useThemeStore } from "../stores/themeStore";
import {
  THOUSANDS_SEPARATORS,
  useNumberFormatStore,
} from "../stores/numberFormatStore";
import { useAuthStore } from "../stores/authStore";
import UserManagementPage from "./UserManagementPage";
import {
  GearIcon,
  BellIcon,
  PaintBrushIcon,
  UsersThreeIcon,
  NotePencilIcon,
  FloppyDiskIcon,
  UserIcon,
  SunIcon,
  MoonIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  GlobeIcon,
  TranslateIcon,
  BellRingingIcon,
  DeviceMobileIcon,
  SignInIcon,
  DatabaseIcon,
  UserPlusIcon,
  TableIcon,
  CalendarDotsIcon,
  MonitorIcon,
  CheckCircleIcon,
  CaretRightIcon,
  InfoIcon,
  HashIcon,
} from "@phosphor-icons/react";

const INPUT_CLASS =
  "w-full border border-border bg-surface text-text-primary rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all placeholder:text-text-muted";

function Toggle({ enabled, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
        enabled ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
      }`}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 bg-surface rounded-full shadow-md transition-transform ${
          enabled ? "translate-x-5.5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function FormField({ label, icon: Icon, children, description }) {
  return (
    <div>
      <label className="flex items-center gap-2 text-xs font-semibold text-text-secondary mb-1.5">
        {Icon && (
          <Icon size={14} weight="duotone" className="text-text-muted" />
        )}
        {label}
      </label>
      {children}
      {description && (
        <p className="text-[10px] text-text-muted mt-1">{description}</p>
      )}
    </div>
  );
}

export default function PengaturanPage() {
  const [activeTab, setActiveTab] = useState("umum");
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  // General settings
  const [generalSettings, setGeneralSettings] = useState({
    namaAplikasi: "Bhumi Satya - Digital Twin",
    deskripsiAplikasi:
      "Platform Digital Twin yang terintegrasi",
    emailAdmin: "admin@bhumisatya.go.id",
    teleponAdmin: "0274-123456",
    alamatKantor: "Jl. Tata Bumi No. 5, Gamping, Sleman, Yogyakarta",
    timezone: "Asia/Jakarta",
    bahasa: "id",
  });

  // Notification settings
  const [notifSettings, setNotifSettings] = useState({
    emailNotifikasi: true,
    pushNotifikasi: true,
    notifLogin: true,
    notifPerubahanData: true,
    notifBackup: true,
    notifUserBaru: true,
  });

  // Display settings
  const darkMode = useThemeStore((s) => s.darkMode);
  const setDarkMode = useThemeStore((s) => s.setDarkMode);
  const thousandsSeparator = useNumberFormatStore(
    (state) => state.thousandsSeparator,
  );
  const setThousandsSeparator = useNumberFormatStore(
    (state) => state.setThousandsSeparator,
  );

  const [displaySettings, setDisplaySettings] = useState({
    tema: darkMode ? "dark" : "light",
    itemPerHalaman: "10",
    formatTanggal: "DD/MM/YYYY",
    pemisahRibuan: thousandsSeparator,
  });

  const tabs = [
    { id: "umum", label: "Umum", icon: GearIcon },
    { id: "notifikasi", label: "Notifikasi", icon: BellIcon },
    { id: "tampilan", label: "Tampilan", icon: PaintBrushIcon },
    ...(isAdmin
      ? [{ id: "users", label: "Manajemen User", icon: UsersThreeIcon }]
      : []),
  ];

  const handleGeneralChange = (field, value) => {
    setGeneralSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleNotifChange = (field, value) => {
    setNotifSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleDisplayChange = (field, value) => {
    setDisplaySettings((prev) => ({ ...prev, [field]: value }));
    if (field === "tema") {
      setDarkMode(value === "dark");
    }
    if (field === "pemisahRibuan") {
      setThousandsSeparator(value);
    }
  };

  const handleSaveSettings = () => {
    toast.success("Pengaturan berhasil disimpan!");
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* ==================== PAGE HEADER ==================== */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-linear-to-br from-accent to-accent/70 rounded-xl flex items-center justify-center">
          <GearIcon size={24} weight="duotone" className="text-surface" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
            Pengaturan
          </h1>
          <p className="mt-0.5 text-xs text-text-tertiary">
            Preferensi aplikasi dan sistem.
          </p>
        </div>
      </div>

      {/* ==================== MAIN CONTAINER ==================== */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="flex flex-col lg:flex-row min-h-130">
          {/* ===== SIDEBAR (lg+) ===== */}
          <div className="hidden lg:flex flex-col w-56 shrink-0 border-r border-border bg-surface-secondary/30">
            <div className="p-4 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center text-start gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-accent text-surface shadow-sm"
                        : "text-text-muted hover:text-text-primary hover:bg-surface"
                    }`}
                  >
                    <Icon size={18} weight={isActive ? "fill" : "duotone"} />
                    {tab.label}
                    {isActive && (
                      <CaretRightIcon
                        size={14}
                        weight="bold"
                        className="ml-auto"
                      />
                    )}
                  </button>
                );
              })}
            </div>
            {/* Sidebar footer info */}
            <div className="mt-auto p-4 border-t border-border">
              <div className="flex items-start gap-2.5 p-3 bg-accent/5 rounded-xl">
                <InfoIcon
                  size={16}
                  weight="duotone"
                  className="text-accent shrink-0 mt-0.5"
                />
                <p className="text-[10px] text-text-muted leading-relaxed">
                  Hanya{" "}
                  <span className="font-bold text-text-secondary">Admin</span>{" "}
                  yang dapat mengubah pengaturan sistem.
                </p>
              </div>
            </div>
          </div>

          {/* ===== MOBILE TABS ===== */}
          <div className="lg:hidden border-b border-border p-2 bg-surface-secondary/30">
            <div className="flex gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-accent text-surface shadow-sm"
                        : "text-text-muted hover:text-text-primary hover:bg-surface"
                    }`}
                  >
                    <Icon size={16} weight={isActive ? "fill" : "regular"} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ===== CONTENT AREA ===== */}
          <div className="flex-1 min-w-0">
            {/* --- TAB: UMUM --- */}
            {activeTab === "umum" && (
              <div className="p-5 sm:p-6 space-y-6">
                {/* Section: Informasi Aplikasi */}
                <section>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-7 h-7 bg-accent/10 rounded-lg flex items-center justify-center">
                      <MonitorIcon
                        size={14}
                        weight="duotone"
                        className="text-accent"
                      />
                    </div>
                    <h3 className="font-bold text-sm text-text-primary">
                      Informasi Aplikasi
                    </h3>
                  </div>
                  <div className="space-y-4 pl-0 sm:pl-9.5">
                    <FormField label="Nama Aplikasi" icon={MonitorIcon}>
                      <input
                        type="text"
                        value={generalSettings.namaAplikasi}
                        onChange={(e) =>
                          handleGeneralChange("namaAplikasi", e.target.value)
                        }
                        className={INPUT_CLASS}
                      />
                    </FormField>
                    <FormField label="Deskripsi Aplikasi">
                      <textarea
                        value={generalSettings.deskripsiAplikasi}
                        onChange={(e) =>
                          handleGeneralChange(
                            "deskripsiAplikasi",
                            e.target.value,
                          )
                        }
                        rows={2}
                        className={`${INPUT_CLASS} resize-none`}
                      />
                    </FormField>
                  </div>
                </section>

                <hr className="border-border" />

                {/* Section: Kontak Administrator */}
                <section>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                      <UserIcon
                        size={14}
                        weight="duotone"
                        className="text-blue-600 dark:text-blue-400"
                      />
                    </div>
                    <h3 className="font-bold text-sm text-text-primary">
                      Kontak Administrator
                    </h3>
                  </div>
                  <div className="space-y-4 pl-0 sm:pl-9.5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormField label="Email Admin" icon={EnvelopeIcon}>
                        <input
                          type="email"
                          value={generalSettings.emailAdmin}
                          onChange={(e) =>
                            handleGeneralChange("emailAdmin", e.target.value)
                          }
                          className={INPUT_CLASS}
                        />
                      </FormField>
                      <FormField label="Telepon Kantor" icon={PhoneIcon}>
                        <input
                          type="tel"
                          value={generalSettings.teleponAdmin}
                          onChange={(e) =>
                            handleGeneralChange("teleponAdmin", e.target.value)
                          }
                          className={INPUT_CLASS}
                        />
                      </FormField>
                    </div>
                    <FormField label="Alamat Kantor" icon={MapPinIcon}>
                      <textarea
                        value={generalSettings.alamatKantor}
                        onChange={(e) =>
                          handleGeneralChange("alamatKantor", e.target.value)
                        }
                        rows={2}
                        className={`${INPUT_CLASS} resize-none`}
                      />
                    </FormField>
                  </div>
                </section>

                <hr className="border-border" />

                {/* Section: Regional */}
                <section>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-7 h-7 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
                      <GlobeIcon
                        size={14}
                        weight="duotone"
                        className="text-emerald-600 dark:text-emerald-400"
                      />
                    </div>
                    <h3 className="font-bold text-sm text-text-primary">
                      Regional
                    </h3>
                  </div>
                  <div className="pl-0 sm:pl-9.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField label="Timezone" icon={GlobeIcon}>
                        <select
                          value={generalSettings.timezone}
                          onChange={(e) =>
                            handleGeneralChange("timezone", e.target.value)
                          }
                          className={INPUT_CLASS}
                        >
                          <option value="Asia/Jakarta">
                            Asia/Jakarta (WIB)
                          </option>
                          <option value="Asia/Makassar">
                            Asia/Makassar (WITA)
                          </option>
                          <option value="Asia/Jayapura">
                            Asia/Jayapura (WIT)
                          </option>
                        </select>
                      </FormField>
                      <FormField label="Bahasa" icon={TranslateIcon}>
                        <select
                          value={generalSettings.bahasa}
                          onChange={(e) =>
                            handleGeneralChange("bahasa", e.target.value)
                          }
                          className={INPUT_CLASS}
                        >
                          <option value="id">Bahasa Indonesia</option>
                          <option value="en">English</option>
                        </select>
                      </FormField>
                    </div>
                  </div>
                </section>

                {/* Save */}
                <div className="flex justify-end pt-2 border-t border-border">
                  <button
                    onClick={handleSaveSettings}
                    className="flex items-center gap-2 bg-accent text-surface px-6 py-2.5 rounded-xl hover:opacity-90 transition-all text-sm font-bold shadow-lg shadow-accent/20 mt-4"
                  >
                    <FloppyDiskIcon size={16} weight="bold" />
                    Simpan Pengaturan
                  </button>
                </div>
              </div>
            )}

            {/* --- TAB: NOTIFIKASI --- */}
            {activeTab === "notifikasi" && (
              <div className="p-5 sm:p-6 space-y-6">
                {/* Section: Channel */}
                <section>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-7 h-7 bg-accent/10 rounded-lg flex items-center justify-center">
                      <BellRingingIcon
                        size={14}
                        weight="duotone"
                        className="text-accent"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-text-primary">
                        Channel Notifikasi
                      </h3>
                      <p className="text-[10px] text-text-muted">
                        Pilih metode pengiriman notifikasi
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 pl-0 sm:pl-9.5">
                    {[
                      {
                        key: "emailNotifikasi",
                        label: "Email Notifikasi",
                        desc: "Kirim notifikasi melalui email",
                        icon: EnvelopeIcon,
                        iconBg: "bg-blue-100 dark:bg-blue-900/20",
                        iconColor: "text-blue-600 dark:text-blue-400",
                      },
                      {
                        key: "pushNotifikasi",
                        label: "Push Notifikasi (In-App)",
                        desc: "Tampilkan notifikasi di dalam aplikasi",
                        icon: DeviceMobileIcon,
                        iconBg: "bg-purple-100 dark:bg-purple-900/20",
                        iconColor: "text-purple-600 dark:text-purple-400",
                      },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.key}
                          className="flex items-center justify-between p-3.5 bg-surface-secondary/40 rounded-xl border border-border transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 ${item.iconBg} rounded-lg flex items-center justify-center shrink-0`}
                            >
                              <Icon
                                size={18}
                                weight="duotone"
                                className={item.iconColor}
                              />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-text-primary">
                                {item.label}
                              </p>
                              <p className="text-[10px] text-text-muted">
                                {item.desc}
                              </p>
                            </div>
                          </div>
                          <Toggle
                            enabled={notifSettings[item.key]}
                            onToggle={() =>
                              handleNotifChange(
                                item.key,
                                !notifSettings[item.key],
                              )
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>

                <hr className="border-border" />

                {/* Section: Jenis Notifikasi */}
                <section>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-7 h-7 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                      <BellIcon
                        size={14}
                        weight="duotone"
                        className="text-orange-600 dark:text-orange-400"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-text-primary">
                        Jenis Notifikasi
                      </h3>
                      <p className="text-[10px] text-text-muted">
                        Pilih notifikasi yang ingin diterima
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 pl-0 sm:pl-9.5">
                    {[
                      {
                        key: "notifLogin",
                        label: "Notifikasi Login",
                        desc: "Saat ada aktivitas login ke sistem",
                        icon: SignInIcon,
                        iconBg: "bg-emerald-100 dark:bg-emerald-900/20",
                        iconColor: "text-emerald-600 dark:text-emerald-400",
                      },
                      {
                        key: "notifPerubahanData",
                        label: "Perubahan Data Aset",
                        desc: "Saat data aset ditambah, diubah, atau dihapus",
                        icon: NotePencilIcon,
                        iconBg: "bg-blue-100 dark:bg-blue-900/20",
                        iconColor: "text-blue-600 dark:text-blue-400",
                      },
                      {
                        key: "notifBackup",
                        label: "Backup & Restore",
                        desc: "Saat proses backup/restore dilakukan",
                        icon: DatabaseIcon,
                        iconBg: "bg-purple-100 dark:bg-purple-900/20",
                        iconColor: "text-purple-600 dark:text-purple-400",
                      },
                      {
                        key: "notifUserBaru",
                        label: "User Baru",
                        desc: "Saat ada pendaftaran user baru",
                        icon: UserPlusIcon,
                        iconBg: "bg-orange-100 dark:bg-orange-900/20",
                        iconColor: "text-orange-600 dark:text-orange-400",
                      },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.key}
                          className="flex items-center justify-between p-3.5 bg-surface-secondary/40 rounded-xl border border-border transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 ${item.iconBg} rounded-lg flex items-center justify-center shrink-0`}
                            >
                              <Icon
                                size={18}
                                weight="duotone"
                                className={item.iconColor}
                              />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-text-primary">
                                {item.label}
                              </p>
                              <p className="text-[10px] text-text-muted">
                                {item.desc}
                              </p>
                            </div>
                          </div>
                          <Toggle
                            enabled={notifSettings[item.key]}
                            onToggle={() =>
                              handleNotifChange(
                                item.key,
                                !notifSettings[item.key],
                              )
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Save */}
                <div className="flex justify-end pt-2 border-t border-border">
                  <button
                    onClick={handleSaveSettings}
                    className="flex items-center gap-2 bg-accent text-surface px-6 py-2.5 rounded-xl hover:opacity-90 transition-all text-sm font-bold shadow-lg shadow-accent/20 mt-4"
                  >
                    <FloppyDiskIcon size={16} weight="bold" />
                    Simpan Pengaturan
                  </button>
                </div>
              </div>
            )}

            {/* --- TAB: TAMPILAN --- */}
            {activeTab === "tampilan" && (
              <div className="p-5 sm:p-6 space-y-6">
                {/* Section: Tema */}
                <section>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-7 h-7 bg-accent/10 rounded-lg flex items-center justify-center">
                      <PaintBrushIcon
                        size={14}
                        weight="duotone"
                        className="text-accent"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-text-primary">
                        Tema Aplikasi
                      </h3>
                      <p className="text-[10px] text-text-muted">
                        Pilih tampilan yang nyaman untuk Anda
                      </p>
                    </div>
                  </div>
                  <div className="pl-0 sm:pl-9.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        {
                          id: "light",
                          label: "Light Mode",
                          desc: "Tampilan terang",
                          icon: SunIcon,
                          previewBg: "bg-surface",
                          previewBorder: "border-gray-200",
                          iconColor: "text-amber-500",
                          bars: ["bg-gray-200", "bg-gray-100", "bg-gray-50"],
                        },
                        {
                          id: "dark",
                          label: "Dark Mode",
                          desc: "Tampilan gelap",
                          icon: MoonIcon,
                          previewBg: "bg-gray-900",
                          previewBorder: "border-gray-700",
                          iconColor: "text-indigo-400",
                          bars: [
                            "bg-gray-700",
                            "bg-gray-800",
                            "bg-gray-800/50",
                          ],
                        },
                      ].map((theme) => {
                        const Icon = theme.icon;
                        const isActive = displaySettings.tema === theme.id;
                        return (
                          <button
                            key={theme.id}
                            onClick={() =>
                              handleDisplayChange("tema", theme.id)
                            }
                            className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                              isActive
                                ? "border-accent bg-accent/5 shadow-sm"
                                : "border-border hover:border-accent/30"
                            }`}
                          >
                            {isActive && (
                              <div className="absolute top-3 right-3">
                                <CheckCircleIcon
                                  size={20}
                                  weight="fill"
                                  className="text-accent"
                                />
                              </div>
                            )}
                            <div
                              className={`w-full h-20 ${theme.previewBg} rounded-lg border ${theme.previewBorder} mb-3 p-2.5 flex flex-col gap-1.5`}
                            >
                              <div
                                className={`h-2 w-12 ${theme.bars[0]} rounded-full`}
                              />
                              <div
                                className={`h-2 w-20 ${theme.bars[1]} rounded-full`}
                              />
                              <div className="flex gap-1.5 mt-auto">
                                <div
                                  className={`h-6 flex-1 ${theme.bars[2]} rounded`}
                                />
                                <div
                                  className={`h-6 flex-1 ${theme.bars[2]} rounded`}
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Icon
                                size={18}
                                weight="duotone"
                                className={theme.iconColor}
                              />
                              <div>
                                <p className="text-sm font-bold text-text-primary">
                                  {theme.label}
                                </p>
                                <p className="text-[10px] text-text-muted">
                                  {theme.desc}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </section>

                <hr className="border-border" />

                {/* Section: Preferensi Tampilan */}
                <section>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-7 h-7 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                      <TableIcon
                        size={14}
                        weight="duotone"
                        className="text-purple-600 dark:text-purple-400"
                      />
                    </div>
                    <h3 className="font-bold text-sm text-text-primary">
                      Preferensi Tampilan
                    </h3>
                  </div>
                  <div className="pl-0 sm:pl-9.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField label="Item Per Halaman" icon={TableIcon}>
                        <select
                          value={displaySettings.itemPerHalaman}
                          onChange={(e) =>
                            handleDisplayChange(
                              "itemPerHalaman",
                              e.target.value,
                            )
                          }
                          className={INPUT_CLASS}
                        >
                          <option value="10">10 item</option>
                          <option value="25">25 item</option>
                          <option value="50">50 item</option>
                          <option value="100">100 item</option>
                        </select>
                      </FormField>
                      <FormField label="Format Tanggal" icon={CalendarDotsIcon}>
                        <select
                          value={displaySettings.formatTanggal}
                          onChange={(e) =>
                            handleDisplayChange("formatTanggal", e.target.value)
                          }
                          className={INPUT_CLASS}
                        >
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                      </FormField>
                      <FormField
                        label="Pemisah Ribuan"
                        icon={HashIcon}
                        description={
                          displaySettings.pemisahRibuan ===
                          THOUSANDS_SEPARATORS.COMMA
                            ? "Contoh: Rp 1,000,000"
                            : "Contoh: Rp 1.000.000"
                        }
                      >
                        <select
                          value={displaySettings.pemisahRibuan}
                          onChange={(e) =>
                            handleDisplayChange(
                              "pemisahRibuan",
                              e.target.value,
                            )
                          }
                          className={INPUT_CLASS}
                        >
                          <option value={THOUSANDS_SEPARATORS.COMMA}>
                            Koma (1,000)
                          </option>
                          <option value={THOUSANDS_SEPARATORS.DOT}>
                            Titik (1.000)
                          </option>
                        </select>
                      </FormField>
                    </div>
                  </div>
                </section>

                {/* Save */}
                <div className="flex justify-end pt-2 border-t border-border">
                  <button
                    onClick={handleSaveSettings}
                    className="flex items-center gap-2 bg-accent text-surface px-6 py-2.5 rounded-xl hover:opacity-90 transition-all text-sm font-bold shadow-lg shadow-accent/20 mt-4"
                  >
                    <FloppyDiskIcon size={16} weight="bold" />
                    Simpan Pengaturan
                  </button>
                </div>
              </div>
            )}

            {/* --- TAB: MANAJEMEN USER (Admin only) --- */}
            {activeTab === "users" && isAdmin && <UserManagementPage />}
          </div>
        </div>
      </div>
    </div>
  );
}
