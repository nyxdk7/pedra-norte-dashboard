import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  children,
  className = "",
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500",
    secondary:
      "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:text-slate-400",
    ghost:
      "bg-transparent text-slate-600 hover:bg-slate-100 disabled:text-slate-400",
  };

  return (
    <button
      type={type}
      className={[
        "inline-flex min-h-9 items-center justify-center rounded-md px-4 text-[13px] font-medium transition",
        "focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-1",
        variants[variant],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
