import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Star } from "lucide-react";
import { auth } from "@/lib/auth";
import { listAdminReviews } from "@/services/review.service";
import { formatDate } from "@/utils";

export const metadata: Metadata = {
  title: "Testimonials",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Published guest reviews are the only testimonials eligible for public use. */
export default async function TestimonialsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/testimonials");
  if (session.user.role !== "admin") redirect("/unauthorized");

  const testimonials = await listAdminReviews("APPROVED");

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl leading-tight font-light sm:text-5xl">Testimonials</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fg-muted">
            Only approved reviews can be reused as public guest testimonials.
          </p>
        </div>
        <Link
          href="/admin/reviews"
          className="rounded-full border border-border-base px-4 py-2.5 text-sm font-medium transition-colors hover:bg-bg-subtle"
        >
          Moderate reviews
        </Link>
      </div>

      {testimonials.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-border-base py-16 text-center">
          <h2 className="font-display text-2xl font-medium">No published testimonials</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">
            Approve eligible guest reviews to make them available for the public site.
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 lg:grid-cols-2">
          {testimonials.map((testimonial) => (
            <li key={testimonial._id} className="rounded-3xl border border-border-base bg-bg-elevated p-6">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{testimonial.guestName}</p>
                <span className="flex items-center gap-1 text-sm text-brass-700 dark:text-brass-300">
                  <Star className="size-3.5 fill-current" /> {testimonial.rating}/5
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-fg-muted">{testimonial.review}</p>
              <p className="mt-4 text-xs text-fg-muted">Approved review · {formatDate(testimonial.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
