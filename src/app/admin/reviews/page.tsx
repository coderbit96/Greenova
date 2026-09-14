import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Star } from "lucide-react";
import { auth } from "@/lib/auth";
import { listAdminReviews } from "@/services/review.service";
import { formatDate } from "@/utils";
import Badge, { statusTone } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Reviews",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  // Re-checked here, not only in the layout: layouts and pages render in
  // parallel, so a layout redirect cannot stop this page's queries.
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/login?callbackUrl=/admin/reviews");

  const reviews = await listAdminReviews();

  const pending = reviews.filter((r) => r.status === "PENDING").length;
  const approved = reviews.filter((r) => r.status === "APPROVED").length;

  return (
    <div>
      <h1 className="font-display text-4xl leading-tight font-light sm:text-5xl">Reviews</h1>
      <p className="mt-3 text-sm text-fg-muted">
        {reviews.length} submitted · {pending} awaiting moderation · {approved} published
      </p>

      {reviews.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-border-base py-16 text-center">
          <h2 className="font-display text-2xl font-medium">No reviews yet</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-fg-muted">
            Guests can review a room once their stay is complete. Submissions appear here
            for moderation before they are shown publicly.
          </p>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {reviews.map((review) => (
            <li
              key={review._id}
              className="rounded-3xl border border-border-base bg-bg-elevated p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-fg">{review.guestName}</p>
                    <span className="flex items-center gap-0.5 text-sm text-brass-600 dark:text-brass-300">
                      <Star className="size-3.5 fill-current" />
                      {review.rating.toFixed(1)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-fg-muted">
                    {formatDate(review.createdAt)}
                  </p>
                </div>
                <Badge tone={statusTone(review.status)}>
                  {review.status[0] + review.status.slice(1).toLowerCase()}
                </Badge>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-pretty text-fg-muted">
                {review.review}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
