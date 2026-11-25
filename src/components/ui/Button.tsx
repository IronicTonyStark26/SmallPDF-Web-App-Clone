import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-ink shadow-sm hover:brightness-95 disabled:opacity-50",
  secondary:
    "border border-line bg-canvas text-ink hover:bg-canvas-muted disabled:opacity-50",
  ghost: "bg-transparent text-ink-muted hover:bg-canvas-muted hover:text-ink",
  danger: "border border-line bg-canvas text-danger hover:bg-canvas-muted",
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition duration-200 ${variantClass[variant]} ${className}`}
      {...props}
    />
  );
}
