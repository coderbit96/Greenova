import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AdminStub from "@/components/admin/AdminStub";

export const metadata: Metadata = {
  title: "Testimonials",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function TestimonialsPage() {
  // Re-checked here, not only in the layout: pages and layouts render in
  // parallel, so a layout redirect cannot stop this page rendering.
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/login?callbackUrl=/admin/testimonials");

  return (
    <AdminStub
      title="Testimonials"
      description="Guest quotes featured on the home page."
      requires={["Testimonial"]}
    />
  );
}
