export default function BrandMark({ className = "" }) {
  return (
    <img
      src="/bhumi-satya-logo.png"
      alt="Logo Bhumi Satya"
      width="1254"
      height="1254"
      decoding="async"
      draggable="false"
      className={`inline-block shrink-0 object-contain ${className}`}
    />
  );
}
