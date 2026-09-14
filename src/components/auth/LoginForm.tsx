"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { loginSchema, type LoginInput } from "@/validators";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import AuthShell from "@/components/auth/AuthShell";
import GoogleButton from "@/components/auth/GoogleButton";
import { safeInternalPath } from "@/lib/redirects";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = safeInternalPath(params.get("callbackUrl"));
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setSubmitting(true);
    try {
      const res = await signIn("credentials", {
        ...values,
        redirect: false,
      });

      if (res?.error) {
        toast.error("Those details do not match an account.");
        return;
      }

      toast.success("Welcome back.");
      router.push(callbackUrl);
      router.refresh();
    } catch {
      toast.error("Could not sign you in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage your reservations and preferences."
      footer={
        <>
          New to Greenova?{" "}
          <Link
            href="/register"
            className="font-medium text-forest-700 underline-offset-4 hover:underline dark:text-forest-400"
          >
            Create an account
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
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />

        <Button type="submit" loading={submitting} className="w-full" size="lg">
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}
