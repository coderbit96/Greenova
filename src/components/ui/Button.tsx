"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-forest-700 text-white hover:bg-forest-600 shadow-sm hover:shadow-lg hover:shadow-forest-900/20 dark:bg-forest-600 dark:hover:bg-forest-500",
  secondary:
    "bg-brass-300 text-sand-900 hover:bg-brass-200 shadow-sm hover:shadow-lg hover:shadow-brass-900/25",
  outline:
    "border border-sand-400 text-fg hover:bg-sand-200 hover:border-sand-500 dark:border-sand-700 dark:hover:bg-sand-800/60",
  ghost: "text-fg hover:bg-bg-subtle",
  danger: "bg-red-600 text-white hover:bg-red-500 shadow-sm",
};

const sizes: Record<Size, string> = {
  sm: "h-11 px-4 text-sm gap-1.5",
  md: "h-11 px-6 text-sm gap-2",
  lg: "h-13 px-8 text-base gap-2.5",
};

const base =
  "inline-flex items-center justify-center rounded-full font-medium tracking-wide transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  className?: string;
  children: React.ReactNode;
}

type ButtonProps = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps>;

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

export default Button;

type LinkButtonProps = CommonProps &
  Omit<React.ComponentProps<typeof Link>, keyof CommonProps>;

export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: LinkButtonProps) {
  return (
    <Link className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </Link>
  );
}
