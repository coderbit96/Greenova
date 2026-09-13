import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Maximize,
  BedDouble,
  Star,
  Check,
  Sparkles,
  Receipt,
  ShieldCheck,
  Clock,
  Building2,
} from "lucide-react";
import { getRoomBySlug, listRelatedRooms } from "@/services/room.service";
import { getBlockedDates } from "@/services/availability.service";
import {
  formatCurrency,
  effectiveRate,
  hasDiscount,
  discountPercent,
  TAX_RATE,
} from "@/utils";
import BookingPanel from "@/components/booking/BookingPanel";
import RoomGallery from "@/components/rooms/RoomGallery";
import RoomCard from "@/components/rooms/RoomCard";
import Reveal from "@/components/ui/Reveal";
import Badge from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

/** Never let a database outage turn a room page into a hard 500. */
async function loadRoom(slug: string) {
  try {
    return await getRoomBySlug(slug);
  } catch (err) {
    console.error("[room] load failed:", err);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const room = await loadRoom(slug);
  if (!room) return { title: "Room not found" };

  return {
    title: room.name,
    description: room.shortDescription,
    openGraph: {
      title: `${room.name} · Greenova`,
      description: room.shortDescription,
      images: room.images?.[0]?.url ? [room.images[0].url] : undefined,
    },
  };
}

export default async function RoomDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    checkIn?: string;
    checkOut?: string;
    adults?: string;
    children?: string;
    rooms?: string;
  }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const room = await loadRoom(slug);

  if (!room) notFound();

  const [blockedDates, related] = await Promise.all([
    getBlockedDates(room._id).catch(() => [] as string[]),
    listRelatedRooms(room.slug, room.category).catch(() => []),
  ]);

  // The thumbnail leads the gallery when set, then the rest of the images.
  const gallery = room.thumbnail
    ? [room.thumbnail, ...room.images.filter((i) => i.url !== room.thumbnail!.url)]
    : room.images;

  const rate = effectiveRate(room);
  const discounted = hasDiscount(room);
  const taxPercent = room.taxRatePercent ?? TAX_RATE * 100;
  const sellableUnits = room.units.filter((u) => u.status === "available").length;

  const specifications = [
    { label: "Category", value: room.category },
    { label: "Bed", value: `${room.bedType} bed` },
    { label: "Room size", value: `${room.sizeSqft} sq ft` },
    {
      label: "Sleeps",
      value: `${room.capacity.adults} adults${
        room.capacity.children > 0 ? `, ${room.capacity.children} children` : ""
      }`,
    },
    { label: "Rooms of this type", value: String(room.totalUnits) },
    {
      label: "Floors",
      value: room.units.length
        ? [...new Set(room.units.map((u) => u.floor))].join(", ")
        : "On request",
    },
  ];

  return (
    <div className="pt-24 pb-24 lg:pt-32">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <RoomGallery images={gallery} roomName={room.name} />
      </section>

      <section className="mx-auto mt-14 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-[1fr_400px] lg:gap-16">
          <div>
            <Reveal>
              <div className="flex flex-wrap items-center gap-3">
                <Badge tone="neutral">{room.category}</Badge>
                {room.featured && <Badge tone="brass">Signature</Badge>}
                {discounted && <Badge tone="success">{discountPercent(room)}% off</Badge>}
                {room.reviewCount > 0 && (
                  <span className="flex items-center gap-1.5 text-sm text-fg-muted">
                    <Star className="size-4 fill-brass-400 text-brass-400" />
                    <span className="font-medium text-fg">{room.rating.toFixed(1)}</span>
                    <span>({room.reviewCount} reviews)</span>
                  </span>
                )}
              </div>

              <h1 className="mt-4 font-display text-4xl leading-tight font-light text-balance sm:text-5xl">
                {room.name}
              </h1>

              <ul className="mt-7 flex flex-wrap gap-x-8 gap-y-3 border-y border-border-base py-5 text-sm text-fg-muted">
                <li className="flex items-center gap-2">
                  <Users className="size-4 text-forest-500" />
                  Up to {room.capacity.adults} adults
                  {room.capacity.children > 0 && `, ${room.capacity.children} children`}
                </li>
                <li className="flex items-center gap-2">
                  <BedDouble className="size-4 text-forest-500" />
                  {room.bedType} bed
                </li>
                <li className="flex items-center gap-2">
                  <Maximize className="size-4 text-forest-500" />
                  {room.sizeSqft} sq ft
                </li>
                <li className="flex items-center gap-2">
                  <Building2 className="size-4 text-forest-500" />
                  {sellableUnits > 0 ? `${sellableUnits} of these rooms` : "Limited"}
                </li>
              </ul>

              <div className="mt-8 space-y-4 text-base leading-relaxed text-pretty text-fg-muted">
                {room.description
                  .split("\n")
                  .filter(Boolean)
                  .map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
              </div>
            </Reveal>

            {/* Specifications */}
            <Reveal delay={0.08} className="mt-12">
              <h2 className="font-display text-2xl font-medium">Room specifications</h2>
              <dl className="mt-6 grid gap-x-8 gap-y-5 rounded-3xl border border-border-base p-7 sm:grid-cols-2 lg:grid-cols-3">
                {specifications.map((spec) => (
                  <div key={spec.label}>
                    <dt className="text-xs tracking-wider text-fg-muted uppercase">
                      {spec.label}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-fg">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>

            {room.amenities.length > 0 && (
              <Reveal delay={0.1} className="mt-12">
                <h2 className="font-display text-2xl font-medium">Amenities</h2>
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {room.amenities.map((a) => (
                    <li key={a} className="flex items-center gap-2.5 text-sm text-fg-muted">
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-forest-50 dark:bg-forest-900/60">
                        <Check className="size-3 text-forest-600 dark:text-forest-400" />
                      </span>
                      {a}
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}

            {room.features.length > 0 && (
              <Reveal delay={0.12} className="mt-12">
                <h2 className="flex items-center gap-2 font-display text-2xl font-medium">
                  <Sparkles className="size-5 text-brass-500" />
                  Room features
                </h2>
                <ul className="mt-6 flex flex-wrap gap-2.5">
                  {room.features.map((f) => (
                    <li
                      key={f}
                      className="rounded-full border border-border-base bg-bg-subtle px-4 py-2 text-sm text-fg-muted"
                    >
                      {f}
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}

            {/* Rates, taxes and fees */}
            <Reveal delay={0.14} className="mt-12">
              <h2 className="flex items-center gap-2 font-display text-2xl font-medium">
                <Receipt className="size-5 text-forest-500" />
                Rates and taxes
              </h2>
              <dl className="mt-6 space-y-3 rounded-3xl bg-bg-subtle p-7 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-fg-muted">Nightly rate</dt>
                  <dd className="flex items-center gap-2">
                    {discounted && (
                      <span className="text-fg-muted line-through">
                        {formatCurrency(room.pricePerNight)}
                      </span>
                    )}
                    <span className="font-medium text-fg">{formatCurrency(rate)}</span>
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-fg-muted">Taxes (GST)</dt>
                  <dd className="text-fg">{taxPercent}% of the total</dd>
                </div>
                {room.additionalFees.map((fee) => (
                  <div key={fee.label} className="flex items-center justify-between">
                    <dt className="text-fg-muted">{fee.label}</dt>
                    <dd className="text-fg">{formatCurrency(fee.amount)} per stay</dd>
                  </div>
                ))}
                <p className="border-t border-border-base pt-3 text-xs leading-relaxed text-fg-muted">
                  Rates include breakfast, the spa circuit and the morning guided walk.
                  There is no resort fee, and the exact total is shown before you pay.
                </p>
              </dl>
            </Reveal>

            {/* Policies */}
            <Reveal delay={0.16} className="mt-12 rounded-3xl bg-bg-subtle p-8">
              <h2 className="font-display text-2xl font-medium">Policies</h2>
              <dl className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <dt className="flex items-center gap-1.5 text-xs tracking-wider text-fg-muted uppercase">
                    <Clock className="size-3.5" />
                    Check-in
                  </dt>
                  <dd className="mt-1 text-sm text-fg">From {room.checkInTime}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-xs tracking-wider text-fg-muted uppercase">
                    <Clock className="size-3.5" />
                    Check-out
                  </dt>
                  <dd className="mt-1 text-sm text-fg">Until {room.checkOutTime}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="flex items-center gap-1.5 text-xs tracking-wider text-fg-muted uppercase">
                    <ShieldCheck className="size-3.5" />
                    Cancellation
                  </dt>
                  <dd className="mt-1 text-sm leading-relaxed text-fg">
                    {room.cancellationPolicy}
                  </dd>
                </div>
              </dl>
              <p className="mt-6 border-t border-border-base pt-5 text-xs leading-relaxed text-fg-muted">
                Full house rules are on our{" "}
                <Link href="/policies" className="underline underline-offset-4 hover:text-fg">
                  policies page
                </Link>
                .
              </p>
            </Reveal>
          </div>

          {/* Booking widget */}
          <div className="lg:relative">
            <div className="lg:sticky lg:top-28">
              <BookingPanel
                room={{
                  _id: room._id,
                  name: room.name,
                  pricePerNight: room.pricePerNight,
                  discountedPrice: room.discountedPrice,
                  capacity: room.capacity,
                  taxRatePercent: room.taxRatePercent,
                  additionalFees: room.additionalFees,
                  checkInTime: room.checkInTime,
                  checkOutTime: room.checkOutTime,
                  cancellationPolicy: room.cancellationPolicy,
                }}
                blockedDates={blockedDates}
                initial={{
                  checkIn: sp.checkIn,
                  checkOut: sp.checkOut,
                  adults: sp.adults ? Number(sp.adults) : undefined,
                  children: sp.children ? Number(sp.children) : undefined,
                  rooms: sp.rooms ? Number(sp.rooms) : undefined,
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Related rooms */}
      {related.length > 0 && (
        <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="font-display text-3xl leading-tight font-light sm:text-4xl">
              You might also like
            </h2>
            <p className="mt-2 text-sm text-fg-muted">
              Other rooms guests compare with the {room.name}.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {related.map((r, i) => (
              <RoomCard key={r._id} room={r} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
