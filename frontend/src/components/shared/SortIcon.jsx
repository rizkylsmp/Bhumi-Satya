import { ArrowUpIcon, ArrowDownIcon } from "@phosphor-icons/react";

/**
 * Reusable sort icon component
 * @param {Object} props
 * @param {string} props.direction - "asc" | "desc" | null
 * @returns {JSX.Element} Sort icon
 */
export function SortIcon({ direction }) {
  if (!direction) {
    return (
      <ArrowUpIcon
        size={14}
        className="text-gray-400 dark:text-gray-600"
      />
    );
  }

  return direction === "asc" ? (
    <ArrowUpIcon
      size={14}
      className="text-blue-600 dark:text-blue-400"
    />
  ) : (
    <ArrowDownIcon
      size={14}
      className="text-blue-600 dark:text-blue-400"
    />
  );
}
