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
      "bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-400 disabled:text-slate-100",
    secondary:
      "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 disabled:text-slate-400",
    ghost:
      "bg-transparent text-slate-700 hover:bg-slate-100 disabled:text-slate-400",
  };

  return (
    <button
      type={type}
      className={[
        "inline-flex min-h-11 items-center justify-center px-5 text-sm font-semibold transition",
        "focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
        variants[variant],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}