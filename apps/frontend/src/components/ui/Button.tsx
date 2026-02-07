import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

function classes(parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

export default function Button({
  variant = "secondary",
  fullWidth,
  className,
  ...props
}: ButtonProps) {
  const variantClass =
    variant === "primary"
      ? "rl-btn-primary"
      : variant === "danger"
        ? "rl-btn-danger"
        : variant === "ghost"
          ? "rl-btn-ghost"
          : "rl-btn-secondary";

  return (
    <button
      {...props}
      className={classes(["rl-btn", variantClass, fullWidth && "w-full", className])}
    />
  );
}
