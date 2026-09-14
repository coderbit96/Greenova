"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Send, CheckCircle2 } from "lucide-react";
import { contactSchema, type ContactInput } from "@/validators/contact";
import { sendContactAction } from "@/actions/contact.actions";
import Button from "@/components/ui/Button";
import Input, { Textarea } from "@/components/ui/Input";

export default function ContactForm() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", phone: "", subject: "", message: "" },
  });

  async function onSubmit(values: ContactInput) {
    setSubmitting(true);
    try {
      const result = await sendContactAction(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setSent(true);
      reset();
      toast.success("Message sent. We will be in touch shortly.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-3xl border border-border-base bg-bg-elevated p-12 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-forest-50 dark:bg-forest-900/60">
          <CheckCircle2 className="size-7 text-forest-600 dark:text-forest-400" strokeWidth={1.5} />
        </span>
        <h2 className="mt-5 font-display text-2xl font-medium">Thank you</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-fg-muted">
          Your message is with our team. We reply within one working day.
        </p>
        <Button variant="outline" className="mt-7" onClick={() => setSent(false)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 rounded-3xl border border-border-base bg-bg-elevated p-6 sm:p-8"
      noValidate
    >
      <input tabIndex={-1} autoComplete="off" className="sr-only" aria-hidden="true" {...register("website")} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Your name"
          autoComplete="name"
          error={errors.name?.message}
          {...register("name")}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input label="Phone" type="tel" autoComplete="tel" error={errors.phone?.message} {...register("phone")} />
      </div>

      <Input
        label="Subject"
        placeholder="Reservation enquiry"
        error={errors.subject?.message}
        {...register("subject")}
      />

      <Textarea
        label="Message"
        placeholder="Tell us about your plans…"
        className="min-h-40"
        error={errors.message?.message}
        {...register("message")}
      />

      <Button type="submit" size="lg" loading={submitting} className="w-full sm:w-auto">
        <Send className="size-4" />
        Send message
      </Button>
    </form>
  );
}
