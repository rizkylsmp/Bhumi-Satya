import { Link } from "react-router-dom";
import BrandMark from "../shared/BrandMark";

export default function PublicFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-md">
          <Link
            to="/beranda"
            className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            aria-label="Kembali ke beranda Bhumi Satya"
          >
            <BrandMark className="h-8 w-8 rounded-lg text-[9px]" />
            <div>
              <p className="text-sm font-bold leading-tight text-text-primary">
                Bhumi Satya
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
                Digital Twin
              </p>
            </div>
          </Link>
          <p className="mt-3 text-xs leading-relaxed text-text-tertiary">
            Platform informasi dan pengelolaan aset berbasis peta 2D dan 3D yang
            terintegrasi.
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-2 border-t border-border pt-4 text-[10px] text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Bhumi Satya. Seluruh hak dilindungi.</span>
          <Link
            to="/dokumentasi"
            className="inline-flex items-center gap-1 rounded-md font-semibold text-text-secondary transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Changelog <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
