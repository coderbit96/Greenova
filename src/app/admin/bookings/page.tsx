import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listAllBookings } from "@/services/booking.service";
import AdminBookings from "@/components/admin/AdminBookings";

export const metadata: Metadata = {
  title: "Manage Bookings",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/login?callbackUrl=/admin/bookings");

  const { bookings } = await listAllBookings({ limit: 100 });
  return <AdminBookings initialBookings={bookings} />;
}
