"use client";

import { useState } from "react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import { updateHotelSettingsAction } from "@/actions/settings.actions";

type Content = { homeHeroTitle?: string; homeHeroSubtitle?: string; about?: string; faqs?: Array<{ question: string; answer: string }> };
const inputClass = "mt-1 w-full rounded-xl border border-border-base bg-bg px-3 py-2.5 text-sm";

export default function WebsiteContentManager({ content }: { content: Content }) {
  const [saving, setSaving] = useState(false);
  const faqText = (content.faqs ?? []).map((faq) => `${faq.question} | ${faq.answer}`).join("\n");
  async function save(formData: FormData) {
    setSaving(true);
    const faqs = String(formData.get("faqs") ?? "").split("\n").map((line) => line.split("|").map((part) => part.trim())).filter(([question, answer]) => question && answer).map(([question, answer]) => ({ question, answer }));
    const result = await updateHotelSettingsAction({ content: { homeHeroTitle: String(formData.get("homeHeroTitle") ?? ""), homeHeroSubtitle: String(formData.get("homeHeroSubtitle") ?? ""), about: String(formData.get("about") ?? ""), faqs } });
    setSaving(false);
    if (result.ok) toast.success("Website content published.");
    else toast.error(result.error);
  }
  return <form action={save} className="mt-8 space-y-6">
    <section className="rounded-3xl border border-border-base bg-bg-elevated p-6 sm:p-8"><h2 className="font-display text-2xl font-medium">Home hero</h2><label className="mt-5 block text-sm font-medium">Title<textarea name="homeHeroTitle" defaultValue={content.homeHeroTitle} className={`${inputClass} min-h-24`} /></label><label className="mt-4 block text-sm font-medium">Subtitle<textarea name="homeHeroSubtitle" defaultValue={content.homeHeroSubtitle} className={`${inputClass} min-h-28`} /></label></section>
    <section className="rounded-3xl border border-border-base bg-bg-elevated p-6 sm:p-8"><h2 className="font-display text-2xl font-medium">About</h2><p className="mt-1 text-sm text-fg-muted">Separate paragraphs with a blank line.</p><textarea name="about" defaultValue={content.about} className={`${inputClass} min-h-56`} /></section>
    <section className="rounded-3xl border border-border-base bg-bg-elevated p-6 sm:p-8"><h2 className="font-display text-2xl font-medium">Frequently asked questions</h2><p className="mt-1 text-sm text-fg-muted">One per line: question | answer</p><textarea name="faqs" defaultValue={faqText} className={`${inputClass} min-h-56`} /></section>
    <Button type="submit" loading={saving} size="lg">Publish content</Button>
  </form>;
}
