export default function BrandMark({ className = "" }) {
  return (
    <span
      role="img"
      aria-label="Bhumi Satya"
      className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-teal-700 font-black tracking-[-0.08em] text-white shadow-sm ${className}`}
    >
      BS
    </span>
  );
}
