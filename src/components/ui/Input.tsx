"use client";

import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useId, useState } from "react";
import { cn } from "@/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const fieldBase =
  "w-full rounded-xl border bg-bg-elevated px-4 py-3 text-sm text-fg placeholder:text-fg-muted/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-forest-500/40 focus:border-forest-500 disabled:opacity-60";

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className, id, type, ...props },
  ref,
) {
  const generated = useId();
  const inputId = id ?? generated;
  const describedBy = error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined;
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-fg">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={isPassword && isPasswordVisible ? "text" : type}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cn(
            fieldBase,
            isPassword && "pr-12",
            error && "border-red-500 focus:ring-red-500/30",
            className,
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            aria-controls={inputId}
            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            aria-pressed={isPasswordVisible}
            title={isPasswordVisible ? "Hide password" : "Show password"}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setIsPasswordVisible((visible) => !visible)}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-xl text-fg-muted transition-colors hover:text-forest-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-500 focus-visible:ring-inset dark:hover:text-forest-300"
          >
            {isPasswordVisible ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${inputId}-err`} role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-fg-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export default Input;

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, className, id, ...props },
  ref,
) {
  const generated = useId();
  const areaId = id ?? generated;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={areaId} className="mb-1.5 block text-sm font-medium text-fg">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={areaId}
        aria-invalid={!!error}
        className={cn(fieldBase, "min-h-28 resize-y", error && "border-red-500", className)}
        {...props}
      />
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-fg-muted">{hint}</p>
      ) : null}
    </div>
  );
});

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, className, id, children, ...props },
  ref,
) {
  const generated = useId();
  const selectId = id ?? generated;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-fg">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        aria-invalid={!!error}
        className={cn(fieldBase, "cursor-pointer appearance-none bg-no-repeat pr-10", className)}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7f78' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
          backgroundPosition: "right 0.75rem center",
          backgroundSize: "1.1rem",
        }}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
});
