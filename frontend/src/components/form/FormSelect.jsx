export default function FormSelect({
  label,
  name,
  value,
  onChange,
  options = [],
  required = false,
  placeholder = "Pilih...",
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
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full border-2 border-border bg-surface text-text-primary outline-none rounded-xl hover:border-text-tertiary focus:border-accent focus:ring-2 focus:ring-accent/20 cursor-pointer transition-all ${sizeClasses[size]}`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
