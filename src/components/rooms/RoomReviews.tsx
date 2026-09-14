import Image from "next/image";
import { Star } from "lucide-react";
import type { ReviewDTO } from "@/types/models";
import { formatDate } from "@/utils";

export default function RoomReviews({ reviews }: { reviews: ReviewDTO[] }) {
  if (reviews.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl font-medium">Guest reviews</h2>
      <div className="mt-6 grid gap-5">
        {reviews.map((review) => (
          <article key={review._id} className="rounded-3xl border border-border-base bg-bg-elevated p-6 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-fg">{review.guestName}</p>
                <p className="mt-0.5 text-xs text-fg-muted">{formatDate(review.createdAt)}</p>
              </div>
              <p className="flex items-center gap-1 text-sm font-medium text-fg" aria-label={`${review.rating} out of 5 stars`}>
                <Star className="size-4 fill-brass-400 text-brass-400" />
                {review.rating}.0
              </p>
            </div>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-fg-muted">{review.review}</p>
            {review.images.length > 0 && (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {review.images.map((image) => (
                  <a key={image.url} href={image.url} target="_blank" rel="noreferrer" className="relative aspect-[4/3] overflow-hidden rounded-xl">
                    <Image src={image.url} alt={`Guest photo from ${review.guestName}`} fill sizes="(max-width: 640px) 45vw, 200px" className="object-cover" />
                  </a>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
