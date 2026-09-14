import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getRoomById } from "@/services/room.service";
import CheckoutForm from "@/components/booking/CheckoutForm";
import Spinner from "@/components/ui/Spinner";
import { nightsBetween } from "@/utils";
import { availabilitySchema } from "@/validators/booking";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface SP {
  roomId?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: string;
  children?: string;
  rooms?: string;
}

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const session = await auth();

  const query = new URLSearchParams(
    Object.entries(sp).filter(([, v]) => v !== undefined) as [string, string][],
  ).toString();

  // Guarded here as well as in middleware: pages render in parallel with
  // layouts, so a redirect elsewhere would not stop this page's queries.
  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/checkout?${query}`)}`);
  }

  if (!sp.roomId || !sp.checkIn || !sp.checkOut) redirect("/availability?error=invalid-dates");

  const stay = availabilitySchema.safeParse({
    checkIn: sp.checkIn,
    checkOut: sp.checkOut,
    adults: sp.adults ?? 2,
    children: sp.children ?? 0,
    rooms: sp.rooms ?? 1,
  });
  if (!stay.success) redirect("/availability?error=invalid-dates");

  const { checkIn, checkOut, adults, children, rooms } = stay.data;
  const nights = nightsBetween(checkIn, checkOut);

  const room = await getRoomById(sp.roomId);
  if (!room || !room.active) redirect("/rooms");
  if (adults > room.capacity.adults || children > room.capacity.children) {
    redirect(`/rooms/${room.slug}`);
  }

  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center">
          <Spinner />
        </div>
      }
    >
      <CheckoutForm
        room={room}
        stay={{
          checkIn,
          checkOut,
          adults,
          children,
          rooms,
          nights,
        }}
        user={{
          name: session.user.name ?? "",
          email: session.user.email ?? "",
        }}
      />
    </Suspense>
  );
}
