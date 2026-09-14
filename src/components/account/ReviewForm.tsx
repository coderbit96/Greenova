"use client";

import { useState } from "react";
import { ImagePlus, Star } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import { submitReviewAction } from "@/actions/review.actions";

const MAX_IMAGES = 5;

export default function ReviewForm({ bookingId }: { bookingId: string }) {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (review.trim().length < 20) {
      toast.error("Please write at least 20 characters about your stay.");
      return;
    }

    setSubmitting(true);
    try {
      const images: { url: string; publicId?: string }[] = [];
      for (const file of files) {
        const body = new FormData();
        body.append("bookingId", bookingId);
        body.append("file", file);
        const response = await fetch("/api/reviews/upload", { method: "POST", body });
        const uploaded = (await response.json()) as { url?: string; publicId?: string; error?: string };
        if (!response.ok || !uploaded.url) throw new Error(uploaded.error ?? "Image upload failed.");
        images.push({ url: uploaded.url, publicId: uploaded.publicId });
      }

      const result = await submitReviewAction({ bookingId, rating, review, images });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Thank you. Your review is awaiting approval.");
      setReview("");
      setFiles([]);
      setSubmitted(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit your review.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <p className="mt-5 rounded-2xl bg-forest-50 px-4 py-3 text-sm text-forest-800 dark:bg-forest-900/40 dark:text-forest-200">
        Thank you — your review is awaiting approval.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-5">
      <fieldset>
        <legend className="text-sm font-medium text-fg">Your rating</legend>
        <div className="mt-2 flex gap-1" aria-label={`${rating} out of 5 stars`}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className="rounded p-1 text-brass-500 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-500"
              aria-label={`${value} star${value === 1 ? "" : "s"}`}
            >
              <Star className={`size-6 ${value <= rating ? "fill-current" : "text-border-base"}`} />
            </button>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="text-sm font-medium text-fg">Tell us about your stay</span>
        <textarea
          value={review}
          onChange={(event) => setReview(event.target.value)}
          minLength={20}
          maxLength={2_000}
          required
          rows={5}
          placeholder="What did you enjoy? How was the room, service or setting?"
          className="mt-2 w-full rounded-2xl border border-border-base bg-bg-base px-4 py-3 text-sm outline-none transition focus:border-forest-500"
        />
        <span className="mt-1 block text-right text-xs text-fg-muted">{review.length}/2000</span>
      </label>

      <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-border-base px-4 py-3 text-sm text-fg-muted transition hover:bg-bg-subtle">
        <ImagePlus className="size-4 text-forest-500" />
        <span>Add up to {MAX_IMAGES} photos (optional)</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="sr-only"
          onChange={(event) => {
            const selected = Array.from(event.target.files ?? []);
            if (selected.length > MAX_IMAGES) {
              toast.error(`Please select no more than ${MAX_IMAGES} images.`);
              return;
            }
            if (selected.some((file) => file.size > 5 * 1024 * 1024)) {
              toast.error("Each image must be under 5 MB.");
              return;
            }
            setFiles(selected);
          }}
        />
      </label>
      {files.length > 0 && <p className="text-xs text-fg-muted">{files.map((file) => file.name).join(", ")}</p>}

      <Button type="submit" loading={submitting}>
        Submit review
      </Button>
      <p className="text-xs text-fg-muted">Reviews are published after approval by our team.</p>
    </form>
  );
}
