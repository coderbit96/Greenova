"use client";

import { useState } from "react";
import { Check, EyeOff, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Badge, { statusTone } from "@/components/ui/Badge";
import { deleteReviewAction, moderateReviewAction } from "@/actions/review.actions";
import type { ReviewDTO, ReviewStatus } from "@/types/models";
import { formatDate } from "@/utils";

const FILTERS: Array<ReviewStatus | "ALL"> = ["ALL", "PENDING", "APPROVED", "REJECTED", "HIDDEN"];

export default function AdminReviews({ initialReviews }: { initialReviews: ReviewDTO[] }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [filter, setFilter] = useState<ReviewStatus | "ALL">("ALL");
  const [busyId, setBusyId] = useState<string | null>(null);
  const visible = filter === "ALL" ? reviews : reviews.filter((review) => review.status === filter);

  async function moderate(id: string, status: ReviewStatus) {
    setBusyId(id);
    const result = await moderateReviewAction(id, { status });
    setBusyId(null);
    if (!result.ok) return toast.error(result.error);
    setReviews((current) => current.map((review) => (review._id === id ? result.data : review)));
    toast.success(`Review ${status.toLowerCase()}.`);
  }

  async function remove(id: string) {
    if (!confirm("Permanently delete this review and its uploaded images?")) return;
    setBusyId(id);
    const result = await deleteReviewAction(id);
    setBusyId(null);
    if (!result.ok) return toast.error(result.error);
    setReviews((current) => current.filter((review) => review._id !== id));
    toast.success("Review deleted.");
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl leading-tight font-light sm:text-5xl">Reviews</h1>
          <p className="mt-2 text-sm text-fg-muted">Approve, reject, hide or delete guest feedback.</p>
        </div>
        <p className="text-sm text-fg-muted">{reviews.length} total</p>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button key={item} onClick={() => setFilter(item)} className={`rounded-full px-3 py-1.5 text-xs font-medium ${filter === item ? "bg-forest-700 text-white" : "bg-bg-subtle text-fg-muted hover:text-fg"}`}>
            {item === "ALL" ? "All" : item[0] + item.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {visible.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-border-base py-16 text-center text-sm text-fg-muted">No reviews in this group.</p>
        ) : visible.map((review) => {
          const roomName = typeof review.room === "object" && review.room ? review.room.name : "Deleted room";
          const busy = busyId === review._id;
          return (
            <article key={review._id} className="rounded-3xl border border-border-base bg-bg-elevated p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-medium text-fg">{review.guestName}</h2>
                    <Badge tone={statusTone(review.status)}>{review.status.toLowerCase()}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-fg-muted">{roomName} · {formatDate(review.createdAt)}</p>
                </div>
                <span className="flex items-center gap-1 text-sm font-medium"><Star className="size-4 fill-brass-400 text-brass-400" />{review.rating}/5</span>
              </div>
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-fg-muted">{review.review}</p>
              {review.images.length > 0 && <p className="mt-3 text-xs text-fg-muted">{review.images.length} guest photo{review.images.length === 1 ? "" : "s"} attached</p>}
              <div className="mt-5 flex flex-wrap gap-2 border-t border-border-base pt-4">
                <Button size="sm" loading={busy} onClick={() => void moderate(review._id, "APPROVED")}><Check className="size-3.5" />Approve</Button>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => void moderate(review._id, "REJECTED")}><X className="size-3.5" />Reject</Button>
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => void moderate(review._id, "HIDDEN")}><EyeOff className="size-3.5" />Hide</Button>
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => void remove(review._id)} className="text-red-600 dark:text-red-400"><Trash2 className="size-3.5" />Delete</Button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
