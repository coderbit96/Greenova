import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listAdminReviews } from "@/services/review.service";
import AdminReviews from "@/components/admin/AdminReviews";

export const metadata: Metadata = {
  title: "Reviews",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/reviews");
  if (session.user.role !== "admin") redirect("/unauthorized");

  return <AdminReviews initialReviews={await listAdminReviews()} />;
}
