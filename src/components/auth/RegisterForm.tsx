"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { registerSchema, type RegisterInput } from "@/validators/auth";
import { registerAction } from "@/actions/auth.actions";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import AuthShell from "@/components/auth/AuthShell";
import GoogleButton from "@/components/auth/GoogleButton";

const rules = [
  { test: (v: string) => v.length >= 8, label: "8+ characters" },
  { test: (v: string) => /[A-Z]/.test(v), label: "An uppercase letter" },
  { test: (v: string) => /[a-z]/.test(v), label: "A lowercase letter" },
  { test: (v: string) => /[0-9]/.test(v), label: "A number" },
];

export default function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/account/bookings";
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
    mode: "onBlur",
  });

  const password = watch("password") ?? "";

  async function onSubmit(values: RegisterInput) {
    setSubmitting(true);
    try {
      const created = await registerAction(values);

      if (!created.ok) {
        if (created.error.includes("already exists")) {
          setError("email", { message: created.error });
        }
        toast.error(created.error);
        return;
      }

      // Sign the new user straight in rather than bouncing to the login page.
      const signInRes = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (signInRes?.error) {
        toast.success("Account created. Please sign in.");
        router.push("/login");
        return;
      }

      toast.success("Welcome to Greenova.");
      router.push(callbackUrl);
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Book faster, track your stays and save your preferences."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-forest-700 underline-offset-4 hover:underline dark:text-forest-400"
          >
            Sign in
          </Link>
        </>
      }
    >
      <GoogleButton callbackUrl={callbackUrl} />

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-border-base" />
        <span className="text-xs tracking-wider text-fg-muted uppercase">or</span>
        <span className="h-px flex-1 bg-border-base" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Full name"
          autoComplete="name"
          placeholder="Ananya Rao"
          error={errors.name?.message}
          {...register("name")}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />

        {password.length > 0 && (
          <ul className="grid grid-cols-2 gap-1.5">
            {rules.map((r) => {
              const passed = r.test(password);
              return (
                <li
                  key={r.label}
                  className={`flex items-center gap-1.5 text-xs transition-colors ${
                    passed ? "text-forest-600 dark:text-forest-400" : "text-fg-muted"
                  }`}
                >
                  <Check className={`size-3 ${passed ? "opacity-100" : "opacity-30"}`} />
                  {r.label}
                </li>
              );
            })}
          </ul>
        )}

        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <Button type="submit" loading={submitting} className="w-full" size="lg">
          Create account
        </Button>

        <p className="text-center text-xs leading-relaxed text-fg-muted">
          By continuing you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-2">
            Terms of Stay
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>
      </form>
    </AuthShell>
  );
}
