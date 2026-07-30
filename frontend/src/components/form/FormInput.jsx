import { useNumberFormatStore } from "../../stores/numberFormatStore";
import {
  formatEditableNumber,
  parseEditableNumber,
} from "../../utils/format";

export default function FormInput({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
  size = "md",
  step,
  min,
  max,
  groupThousands,
}) {
  const thousandsSeparator = useNumberFormatStore(
    (state) => state.thousandsSeparator,
  );
  const shouldGroupThousands =
    groupThousands ?? (type === "number" && /\(Rp\)/i.test(label || ""));
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
      <input
        id={name}
        type={shouldGroupThousands ? "text" : type}
        inputMode={shouldGroupThousands ? "decimal" : undefined}
        name={name}
        placeholder={placeholder}
        value={
          shouldGroupThousands
            ? formatEditableNumber(value, thousandsSeparator)
            : value
        }
        onChange={
          shouldGroupThousands
            ? (event) =>
                onChange({
                  target: {
                    name,
                    value: parseEditableNumber(
                      event.target.value,
                      thousandsSeparator,
                    ),
                  },
                })
            : onChange
        }
        step={step}
        min={min}
        max={max}
        required={required}
        className={`w-full border-2 border-border bg-surface text-text-primary placeholder:text-text-muted outline-none rounded-xl hover:border-text-tertiary focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all ${sizeClasses[size]}`}
      />
    </div>
  );
}
