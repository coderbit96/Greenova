import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listAllBookings } from "@/services/booking.service";
import { listAllRooms } from "@/services/room.service";
import AdminBookings from "@/components/admin/AdminBookings";

export const metadata: Metadata = {
  title: "Manage Bookings",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/login?callbackUrl=/admin/bookings");

  const [{ bookings }, rooms] = await Promise.all([listAllBookings({ limit: 100 }), listAllRooms()]);
  return <AdminBookings initialBookings={bookings} rooms={rooms.map((room) => ({ _id: room._id, name: room.name, category: room.category }))} />;
}
