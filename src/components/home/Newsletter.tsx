"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Send, CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { subscribeAction } from "@/actions/newsletter.actions";

const schema = z.object({
  email: z.email("Enter a valid email address"),
});

type FormInput = z.infer<typeof schema>;

export default function Newsletter() {
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: FormInput) {
    setSubmitting(true);
    try {
      const result = await subscribeAction(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setDone(true);
      reset();
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-2xl border border-border-base bg-bg-elevated px-6 py-5">
        <CheckCircle2
          className="size-5 shrink-0 text-forest-600 dark:text-forest-400"
          strokeWidth={1.5}
        />
        <p className="text-sm text-fg">
          You are on the list. We write roughly four times a year.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row sm:items-start"
      noValidate
    >
      <div className="flex-1">
        <Input
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-label="Email address"
          error={errors.email?.message}
          {...register("email")}
        />
      </div>
      <Button type="submit" size="lg" loading={submitting} className="shrink-0">
        <Send className="size-4" />
        Subscribe
      </Button>
    </form>
  );
}
