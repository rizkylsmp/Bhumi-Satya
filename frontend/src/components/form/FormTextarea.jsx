export default function FormTextarea({
  label,
  name,
  placeholder,
  value,
  onChange,
  required = false,
  rows = 3,
  size = "md",
}) {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-3 text-sm",
  };

  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-semibold text-text-primary">
        {label}
        {required && <span className="text-red-600 dark:text-red-400"> *</span>}
      </label>
      <textarea
        id={name}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={rows}
        className={`w-full border-2 border-border bg-surface text-text-primary placeholder:text-text-muted outline-none rounded-xl hover:border-text-tertiary focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-none ${sizeClasses[size]}`}
      />
    </div>
  );
}
