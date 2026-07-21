import * as SwitchPrimitive from "@radix-ui/react-switch";
import clsx from "clsx";

const SIZE_CLASSES = {
  sm: {
    root: "h-5 w-9",
    thumb: "h-4 w-4 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0",
  },
  md: {
    root: "h-6 w-11",
    thumb: "h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
  },
};

const TONE_CLASSES = {
  accent: "data-[state=checked]:bg-accent",
  cyan: "data-[state=checked]:bg-cyan-500",
  sky: "data-[state=checked]:bg-sky-500",
  blue: "data-[state=checked]:bg-blue-500",
  emerald: "data-[state=checked]:bg-emerald-500",
  violet: "data-[state=checked]:bg-violet-500",
  red: "data-[state=checked]:bg-red-500",
};

export default function Switch({
  size = "md",
  tone = "accent",
  className,
  thumbClassName,
  ...props
}) {
  const sizeClasses = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  return (
    <SwitchPrimitive.Root
      {...props}
      className={clsx(
        "group inline-flex shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-slate-300 p-0.5 shadow-inner outline-none transition-colors duration-200",
        "data-[state=unchecked]:bg-slate-300",
        "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "dark:data-[state=unchecked]:bg-slate-700",
        sizeClasses.root,
        TONE_CLASSES[tone] || TONE_CLASSES.accent,
        className,
      )}
    >
      <SwitchPrimitive.Thumb
        className={clsx(
          "pointer-events-none block rounded-full bg-white shadow-md ring-0 transition-transform duration-200 will-change-transform",
          sizeClasses.thumb,
          thumbClassName,
        )}
      />
    </SwitchPrimitive.Root>
  );
}
