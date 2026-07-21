import {
  CaretLeftIcon,
  CaretRightIcon,
  DotsThreeIcon,
  CaretUpIcon,
} from "@phosphor-icons/react";
import { useState, useRef, useEffect } from "react";

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

export default function Pagination({
  currentPage = 1,
  totalPages = 10,
  onPageChange,
  totalItems = 0,
  itemsPerPage = 10,
  onItemsPerPageChange,
}) {
  const [showPerPage, setShowPerPage] = useState(false);
  const perPageRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (perPageRef.current && !perPageRef.current.contains(e.target)) {
        setShowPerPage(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalPages <= 1 && !onItemsPerPageChange) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Info + Per Page */}
      <div className="flex items-center gap-4 order-2 sm:order-1">
        {totalItems > 0 && (
          <p className="text-sm text-text-tertiary">
            Menampilkan{" "}
            <span className="font-medium text-text-primary">
              {startItem}-{endItem}
            </span>{" "}
            dari{" "}
            <span className="font-medium text-text-primary">{totalItems}</span>{" "}
            data
          </p>
        )}

        {/* Per Page Dropup */}
        {onItemsPerPageChange && (
          <div className="relative" ref={perPageRef}>
            <button
              onClick={() => setShowPerPage(!showPerPage)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-secondary border border-border rounded-lg hover:bg-surface-tertiary hover:text-text-primary transition-all cursor-pointer"
            >
              <span>{itemsPerPage} / hal</span>
              <CaretUpIcon
                size={12}
                weight="bold"
                className={`transition-transform duration-200 ${showPerPage ? "" : "rotate-180"}`}
              />
            </button>
            {showPerPage && (
              <div className="absolute bottom-full left-0 mb-1 bg-surface border border-border rounded-lg shadow-lg overflow-hidden z-50 min-w-[100px]">
                {PER_PAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      onItemsPerPageChange(opt);
                      setShowPerPage(false);
                    }}
                    className={`w-full px-4 py-2 text-sm text-left transition-colors cursor-pointer ${
                      opt === itemsPerPage
                        ? "bg-accent/10 text-accent font-medium"
                        : "text-text-secondary hover:bg-surface-tertiary hover:text-text-primary"
                    }`}
                  >
                    {opt} data
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5 order-1 sm:order-2">
          {/* Previous Button */}
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="w-9 h-9 flex items-center justify-center border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            aria-label="Previous page"
          >
            <CaretLeftIcon size={16} weight="bold" />
          </button>

          {/* Page Numbers */}
          {getPageNumbers().map((page, idx) => (
            <button
              key={idx}
              onClick={() => typeof page === "number" && onPageChange(page)}
              disabled={page === "..."}
              className={`min-w-9 h-9 px-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                page === currentPage
                  ? "bg-accent text-surface shadow-sm"
                  : page === "..."
                    ? "cursor-default text-text-muted"
                    : "border border-border text-text-secondary hover:bg-surface-tertiary hover:text-text-primary"
              }`}
            >
              {page === "..." ? (
                <DotsThreeIcon size={16} weight="bold" />
              ) : (
                page
              )}
            </button>
          ))}

          {/* Next Button */}
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="w-9 h-9 flex items-center justify-center border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            aria-label="Next page"
          >
            <CaretRightIcon size={16} weight="bold" />
          </button>
        </div>
      )}
    </div>
  );
}
