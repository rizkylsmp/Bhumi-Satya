import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChartBarIcon,
  ListIcon,
  MoonIcon,
  SignInIcon,
  SunIcon,
} from "@phosphor-icons/react";
import { useThemeStore } from "../../stores/themeStore";
import BrandMark from "../shared/BrandMark";

/** Shared public navigation for the landing page and full-screen public map. */
export default function PublicNavbar({ links = [], onLogin, fixed = false }) {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode, initDarkMode } = useThemeStore();
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    initDarkMode();
  }, [initDarkMode]);

  const runLink = (link) => {
    setMobileNav(false);
    link.onClick?.();
  };

  return (
    <nav className={`${fixed ? "fixed inset-x-0 top-0" : "sticky top-0"} z-50 border-b border-border bg-surface/80 backdrop-blur-xl`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate("/sewa-tersedia")}
          className="flex items-center gap-3 transition-opacity hover:opacity-80"
        >
          <BrandMark className="h-9 w-9 text-xs" />
          <div className="hidden text-left sm:block">
            <h1 className="text-base font-bold leading-none tracking-tight text-text-primary">Bhumi Satya</h1>
            <p className="hidden text-[10px] text-text-muted sm:block">Sistem Manajemen Aset Tanah</p>
          </div>
        </button>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <button
              key={link.label}
              onClick={() => runLink(link)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary"
            >
              <link.icon size={16} weight="bold" />
              {link.label}
            </button>
          ))}
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
            onClick={() => navigate("/ekasmat")}
            className="hidden items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-violet-500/40 hover:text-violet-700 dark:hover:text-violet-300 md:inline-flex"
          >
            <ChartBarIcon size={16} weight="bold" />
            EKASMAT
          </button>
          <button
            onClick={onLogin}
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
          {links.map((link) => (
            <button
              key={link.label}
              onClick={() => runLink(link)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary"
            >
              <link.icon size={16} weight="bold" />
              {link.label}
            </button>
          ))}
          <button
            onClick={() => navigate("/ekasmat")}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary"
          >
            <ChartBarIcon size={16} weight="bold" />
            EKASMAT
          </button>
        </div>
      )}
    </nav>
  );
}
