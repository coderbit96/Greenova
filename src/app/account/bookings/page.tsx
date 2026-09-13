import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listUserBookings } from "@/services/booking.service";
import BookingList from "@/components/account/BookingList";

export const metadata: Metadata = {
  title: "My Bookings",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function MyBookingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/account/bookings");

  const bookings = await listUserBookings(session.user.id);

  return (
    <div>
      <h1 className="font-display text-4xl leading-tight font-light sm:text-5xl">My Bookings</h1>
      <p className="mt-3 text-sm text-fg-muted">
        Upcoming and past stays, with everything you need to manage them.
      </p>
      <div className="mt-10">
        <BookingList bookings={bookings} />
      </div>
    </div>
  );
}
