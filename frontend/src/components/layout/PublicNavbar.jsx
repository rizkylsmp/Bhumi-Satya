import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  HouseIcon,
  ListIcon,
  MapTrifoldIcon,
  MoonIcon,
  SignInIcon,
  StorefrontIcon,
  SunIcon,
} from "@phosphor-icons/react";
import { useThemeStore } from "../../stores/themeStore";
import BrandMark from "../shared/BrandMark";

const PUBLIC_LINKS = [
  {
    label: "Beranda",
    icon: HouseIcon,
    path: "/beranda",
    matches: ["/beranda", "/login"],
  },
  {
    label: "Digital Twin",
    icon: MapTrifoldIcon,
    path: "/peta-publik",
    matches: ["/peta-publik"],
  },
  {
    label: "Sewa Aset",
    icon: StorefrontIcon,
    path: "/sewa-aset",
    matches: ["/sewa-aset"],
  },
];

/** Navigasi persisten untuk seluruh halaman publik. */
export default function PublicNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleDarkMode, initDarkMode } = useThemeStore();
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    initDarkMode();
  }, [initDarkMode]);

  const openPage = (path) => {
    setMobileNav(false);
    navigate(path);
  };

  const openLogin = () => {
    setMobileNav(false);
    navigate("/login", { state: { openLoginPanel: true } });
  };

  return (
    <nav className="sticky top-0 z-50 shrink-0 border-b border-border bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate("/beranda")}
          className="flex items-center gap-3 transition-opacity hover:opacity-80"
        >
          <BrandMark className="h-9 w-9 text-xs" />
          <div className="hidden text-left sm:block">
            <h1 className="text-base font-bold leading-none tracking-tight text-text-primary">Bhumi Satya</h1>
            <p className="hidden text-[10px] text-text-muted sm:block">Digital Twin STPN</p>
          </div>
        </button>

        <div className="hidden items-center gap-1 md:flex">
          {PUBLIC_LINKS.map((link) => {
            const active = link.matches.includes(location.pathname);
            return (
              <button
                key={link.path}
                onClick={() => openPage(link.path)}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent/10 text-accent"
                    : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
                }`}
              >
                <link.icon size={16} weight="bold" />
                {link.label}
              </button>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => setMobileNav((open) => !open)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:bg-surface-secondary hover:text-text-primary md:hidden"
            aria-label="Buka navigasi"
          >
            <ListIcon size={18} weight="bold" />
          </button>
          <button
            onClick={toggleDarkMode}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:bg-surface-secondary hover:text-text-primary"
            aria-label={darkMode ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
          >
            {darkMode ? <SunIcon size={18} weight="bold" /> : <MoonIcon size={18} weight="bold" />}
          </button>
          <button
            onClick={openLogin}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-surface transition-colors hover:bg-accent-hover sm:px-4"
            aria-label="Login Bhumi Satya"
          >
            <SignInIcon size={16} weight="bold" />
            <span className="hidden sm:inline">Login</span>
          </button>
        </div>
      </div>

      {mobileNav && (
        <div className="space-y-1 border-t border-border bg-surface px-4 py-2 md:hidden">
          {PUBLIC_LINKS.map((link) => {
            const active = link.matches.includes(location.pathname);
            return (
              <button
                key={link.path}
                onClick={() => openPage(link.path)}
                aria-current={active ? "page" : undefined}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent/10 text-accent"
                    : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
                }`}
              >
                <link.icon size={16} weight="bold" />
                {link.label}
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
}
