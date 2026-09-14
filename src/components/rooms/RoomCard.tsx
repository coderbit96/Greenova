"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, Maximize, BedDouble, Star, Check } from "lucide-react";
import { formatCurrency, effectiveRate, hasDiscount, discountPercent } from "@/utils/money";
import { cn } from "@/utils/cn";
import Badge from "@/components/ui/Badge";
import type { RoomDTO } from "@/types/models";

/** Listing cards need only a slice of the room, plus live availability. */
export type RoomCardData = Pick<
  RoomDTO,
  | "_id"
  | "name"
  | "slug"
  | "shortDescription"
  | "pricePerNight"
  | "capacity"
  | "bedType"
  | "sizeSqft"
  | "images"
> &
  Partial<
    Pick<
      RoomDTO,
      | "category"
      | "thumbnail"
      | "discountedPrice"
      | "amenities"
      | "featured"
      | "rating"
      | "reviewCount"
    >
  > & {
    unitsLeft?: number;
    available?: boolean;
  };

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1600&auto=format&fit=crop";

/** Three amenities is enough to differentiate without crowding the card. */
const AMENITIES_SHOWN = 3;

export default function RoomCard({
  room,
  query,
  index = 0,
}: {
  room: RoomCardData;
  query?: string;
  index?: number;
}) {
  const detailsHref = query ? `/rooms/${room.slug}?${query}` : `/rooms/${room.slug}`;

  // Book Now goes straight to checkout when we already know the dates,
  // otherwise to the room page where the guest picks them.
  const bookHref = query ? `/checkout?roomId=${room._id}&${query}` : detailsHref;

  const soldOut = room.available === false;
  const image = room.thumbnail?.url ?? room.images?.[0]?.url ?? FALLBACK_IMAGE;

  const rate = effectiveRate(room);
  const discounted = hasDiscount(room);
  const discount = discountPercent(room);
  const shownAmenities = (room.amenities ?? []).slice(0, AMENITIES_SHOWN);
  const extraAmenities = (room.amenities?.length ?? 0) - shownAmenities.length;

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: Math.min(index * 0.08, 0.4), ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-border-base bg-bg-elevated shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-forest-950/10"
    >
      <Link href={detailsHref} className="relative block aspect-4/3 overflow-hidden">
        <Image
          src={image}
          alt={room.thumbnail?.alt ?? room.images?.[0]?.alt ?? room.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={cn(
            "object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-107",
            soldOut && "grayscale-[0.6]",
          )}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-70" />

        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          {room.featured && <Badge tone="brass">Signature</Badge>}
          {discounted && <Badge tone="success">{discount}% off</Badge>}
          {soldOut ? (
            <Badge tone="danger">Sold out</Badge>
          ) : room.unitsLeft !== undefined && room.unitsLeft <= 2 ? (
            <Badge tone="warning">Only {room.unitsLeft} left</Badge>
          ) : null}
        </div>

        {room.rating !== undefined && room.reviewCount ? (
          <div className="absolute right-4 bottom-4 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-forest-900 backdrop-blur">
            <Star className="size-3 fill-brass-400 text-brass-400" />
            {room.rating.toFixed(1)}
          </div>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col p-6">
        {room.category && (
          <p className="text-xs font-medium tracking-wider text-brass-600 uppercase dark:text-brass-300">
            {room.category}
          </p>
        )}

        <Link href={detailsHref}>
          <h3 className="mt-1 font-display text-2xl font-medium text-fg transition-colors group-hover:text-forest-700 dark:group-hover:text-forest-300">
            {room.name}
          </h3>
        </Link>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-fg-muted">
          {room.shortDescription}
        </p>

        <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-fg-muted">
          <li className="flex items-center gap-1.5">
            <Users className="size-3.5 text-forest-500" />
            {room.capacity.adults} guests
          </li>
          <li className="flex items-center gap-1.5">
            <BedDouble className="size-3.5 text-forest-500" />
            {room.bedType}
          </li>
          <li className="flex items-center gap-1.5">
            <Maximize className="size-3.5 text-forest-500" />
            {room.sizeSqft} sq ft
          </li>
        </ul>

        {shownAmenities.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-fg-muted">
            {shownAmenities.map((a) => (
              <li key={a} className="flex items-center gap-1.5">
                <Check className="size-3 text-forest-500" />
                {a}
              </li>
            ))}
            {extraAmenities > 0 && (
              <li className="text-fg-muted/70">+{extraAmenities} more</li>
            )}
          </ul>
        )}

        <div className="mt-6 border-t border-border-base pt-5">
          <div className="flex items-end gap-2">
            {discounted && (
              <span className="text-sm text-fg-muted line-through">
                {formatCurrency(room.pricePerNight)}
              </span>
            )}
            <span className="font-display text-3xl font-medium text-fg">
              {formatCurrency(rate)}
            </span>
            <span className="pb-1 text-xs text-fg-muted">/ night</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={detailsHref}
              className="rounded-full border border-sand-400 px-4 py-2.5 text-sm font-medium text-fg transition-all duration-300 hover:bg-sand-200 dark:border-sand-700 dark:hover:bg-sand-800/60"
            >
              View Details
            </Link>
            <Link
              href={bookHref}
              className={cn(
                "rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300",
                soldOut
                  ? "pointer-events-none bg-bg-subtle text-fg-muted"
                  : "bg-forest-700 text-white hover:bg-forest-600 dark:bg-forest-600 dark:hover:bg-forest-500",
              )}
              aria-disabled={soldOut}
            >
              {soldOut ? "Unavailable" : "Book Now"}
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
