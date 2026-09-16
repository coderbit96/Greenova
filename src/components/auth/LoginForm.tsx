"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { signInWithEmailAndPassword, signOut as signOutOfFirebase } from "firebase/auth";
import { loginSchema, type LoginInput } from "@/validators";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import AuthShell from "@/components/auth/AuthShell";
import { safeInternalPath } from "@/lib/redirects";
import { getFirebaseAuth } from "@/lib/firebase/client";

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
      const firebaseAuth = getFirebaseAuth();
      const res = firebaseAuth
        ? await (async () => {
            const credential = await signInWithEmailAndPassword(
              firebaseAuth,
              values.email,
              values.password,
            );
            const idToken = await credential.user.getIdToken();
            const result = await signIn("firebase", { idToken, redirect: false });
            if (result?.error) await signOutOfFirebase(firebaseAuth);
            return result;
          })()
        : await signIn("credentials", { ...values, redirect: false });

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
