import type { InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

function classes(parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

export default function Input({ invalid, className, ...props }: InputProps) {
  const ariaInvalid = invalid ?? props["aria-invalid"];

  return (
    <input
      {...props}
      aria-invalid={ariaInvalid}
      className={classes(["rl-input", className])}
    />
  );
}
