"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import AuthShell from "@/components/auth/AuthShell";
import { requestPasswordResetAction } from "@/actions/password.actions";

const schema = z.object({
  email: z.email("Enter a valid email address"),
});

type FormInput = z.infer<typeof schema>;

export default function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: FormInput) {
    setSubmitting(true);
    try {
      const result = await requestPasswordResetAction(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      // Always the same outcome, registered or not.
      setSentTo(values.email);
    } finally {
      setSubmitting(false);
    }
  }

  if (sentTo) {
    return (
      <AuthShell
        title="Check your inbox"
        subtitle="If that address has an account, a reset link is on its way."
        footer={
          <Link
            href="/login"
            className="font-medium text-forest-700 underline-offset-4 hover:underline dark:text-forest-400"
          >
            Back to sign in
          </Link>
        }
      >
        <div className="rounded-3xl border border-border-base bg-bg-elevated p-8 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-forest-50 dark:bg-forest-900/60">
            <MailCheck
              className="size-7 text-forest-600 dark:text-forest-400"
              strokeWidth={1.5}
            />
          </span>
          <p className="mt-5 text-sm leading-relaxed text-fg-muted">
            We sent instructions to <span className="font-medium text-fg">{sentTo}</span>.
            The link expires in one hour.
          </p>
          <p className="mt-4 text-xs leading-relaxed text-fg-muted">
            Nothing arrived? Check spam, or{" "}
            <button
              type="button"
              onClick={() => setSentTo(null)}
              className="underline underline-offset-2 hover:text-fg"
            >
              try a different address
            </button>
            .
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email you booked with and we will send a reset link."
      footer={
        <>
          Remembered it?{" "}
          <Link
            href="/login"
            className="font-medium text-forest-700 underline-offset-4 hover:underline dark:text-forest-400"
          >
            Sign in
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

        <Button type="submit" loading={submitting} className="w-full" size="lg">
          Send reset link
        </Button>

        <p className="text-center text-xs leading-relaxed text-fg-muted">
          Signed up with Google? Use{" "}
          <Link href="/login" className="underline underline-offset-2">
            Continue with Google
          </Link>{" "}
          instead — there is no password to reset.
        </p>
      </form>
    </AuthShell>
  );
}
