import {
  CaretDownIcon,
  CaretUpDownIcon,
  CaretUpIcon,
} from "@phosphor-icons/react";

/**
 * Reusable sort icon component
 * @param {Object} props
 * @param {string} props.direction - "asc" | "desc" | null
 * @returns {JSX.Element} Sort icon
 */
export function SortIcon({ direction }) {
  const Icon =
    direction === "asc"
      ? CaretUpIcon
      : direction === "desc"
        ? CaretDownIcon
        : CaretUpDownIcon;

  return (
    <span
      aria-hidden="true"
      className="flex h-4 w-4 shrink-0 items-center justify-center"
    >
      <Icon
        size={14}
        weight={direction ? "bold" : "regular"}
        className={
          direction
            ? "text-accent"
            : "text-text-muted opacity-50"
        }
      />
    </span>
  );
}
