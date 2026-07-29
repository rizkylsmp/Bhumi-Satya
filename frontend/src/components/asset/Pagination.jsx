import {
  CaretLeftIcon,
  CaretRightIcon,
  CaretUpIcon,
  DotsThreeIcon,
} from "@phosphor-icons/react";

const DEFAULT_PAGE_SIZES = [10, 25, 50, 100];

const getPageNumbers = (currentPage, totalPages) => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = [1];
  if (currentPage > 3) pages.push("start-ellipsis");

  for (
    let page = Math.max(2, currentPage - 1);
    page <= Math.min(totalPages - 1, currentPage + 1);
    page += 1
  ) {
    pages.push(page);
  }

  if (currentPage < totalPages - 2) pages.push("end-ellipsis");
  pages.push(totalPages);
  return pages;
};

export default function Pagination({
  pagination = null,
  currentPage: currentPageProp,
  totalPages: totalPagesProp,
  totalItems: totalItemsProp,
  itemsPerPage: itemsPerPageProp,
  onPageChange: onPageChangeProp,
  onItemsPerPageChange: onItemsPerPageChangeProp,
  onChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  embedded = false,
  itemLabel = "data",
}) {
  const currentPage =
    currentPageProp ??
    pagination?.currentPage ??
    pagination?.page ??
    1;
  const totalPages = Math.max(
    1,
    totalPagesProp ?? pagination?.totalPages ?? 1,
  );
  const totalItems =
    totalItemsProp ??
    pagination?.totalItems ??
    pagination?.total ??
    pagination?.totalData ??
    0;
  const itemsPerPage =
    pageSize ??
    itemsPerPageProp ??
    pagination?.itemsPerPage ??
    pagination?.limit ??
    10;
  const onPageChange = onChange || onPageChangeProp;
  const onItemsPerPageChange =
    onPageSizeChange || onItemsPerPageChangeProp;

  if (!totalItems && !onItemsPerPageChange) return null;

  const startItem =
    totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <div
      className={`flex flex-col items-center justify-between gap-3 sm:flex-row ${
        embedded ? "border-t border-border px-4 py-3" : ""
      }`}
    >
      <div className="order-2 flex flex-wrap items-center justify-center gap-3 sm:order-1 sm:justify-start">
        <p className="text-[10px] font-semibold text-text-muted">
          Menampilkan{" "}
          <span className="font-black text-text-primary">
            {startItem}–{endItem}
          </span>{" "}
          dari{" "}
          <span className="font-black text-text-primary">{totalItems}</span>{" "}
          {itemLabel}
        </p>

        {onItemsPerPageChange && (
          <div className="relative">
            <select
              value={itemsPerPage}
              onChange={(event) =>
                onItemsPerPageChange(Number(event.target.value))
              }
              className="h-9 cursor-pointer appearance-none rounded-lg border border-border bg-surface py-0 pl-3 pr-8 text-[9px] font-bold text-text-secondary outline-none transition hover:border-accent hover:text-accent focus:border-accent focus:ring-2 focus:ring-accent/15"
              aria-label="Pilih jumlah baris per halaman"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option} / hal
                </option>
              ))}
            </select>
            <CaretUpIcon
              size={11}
              weight="bold"
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rotate-180 text-text-muted"
            />
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <nav
          className="order-1 flex items-center gap-1.5 sm:order-2"
          aria-label="Navigasi halaman"
        >
          <button
            type="button"
            onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-secondary transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Halaman sebelumnya"
          >
            <CaretLeftIcon size={14} weight="bold" />
          </button>

          {pages.map((page) =>
            typeof page === "number" ? (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange?.(page)}
                aria-current={page === currentPage ? "page" : undefined}
                className={`h-9 min-w-9 rounded-lg px-2 text-[10px] font-bold transition ${
                  page === currentPage
                    ? "bg-accent text-surface"
                    : "border border-border text-text-secondary hover:border-accent hover:text-accent"
                }`}
              >
                {page}
              </button>
            ) : (
              <span
                key={page}
                className="flex h-9 w-7 items-center justify-center text-text-muted"
                aria-hidden="true"
              >
                <DotsThreeIcon size={15} weight="bold" />
              </span>
            ),
          )}

          <button
            type="button"
            onClick={() =>
              onPageChange?.(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage >= totalPages}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-secondary transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Halaman berikutnya"
          >
            <CaretRightIcon size={14} weight="bold" />
          </button>
        </nav>
      )}
    </div>
  );
}
