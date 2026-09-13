"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Eye, EyeOff } from "lucide-react";
import { roomSchema, type RoomInput, type RoomOutput } from "@/validators/room";
import {
  createRoomAction,
  updateRoomAction,
  deleteRoomAction,
} from "@/actions/room.actions";
import type { RoomDTO } from "@/types/models";
import Button from "@/components/ui/Button";
import Input, { Textarea } from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { formatCurrency, slugify } from "@/utils";

const FALLBACK =
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=600&auto=format&fit=crop";

export default function AdminRooms({ initialRooms }: { initialRooms: RoomDTO[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<RoomDTO | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const open = creating || editing !== null;

  async function remove(room: RoomDTO) {
    if (!confirm(`Delete "${room.name}"? Rooms with upcoming bookings are hidden instead.`)) return;

    setBusy(room._id);
    try {
      const result = await deleteRoomAction(room._id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        result.data.deactivated ? result.data.message! : "Room deleted.",
      );
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function toggleActive(room: RoomDTO) {
    setBusy(room._id);
    try {
      const result = await updateRoomAction(room._id, { active: !room.active });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(room.active ? "Room hidden from the site." : "Room is now live.");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl leading-tight font-light sm:text-5xl">Rooms</h1>
          <p className="mt-2 text-sm text-fg-muted">
            {initialRooms.length} {initialRooms.length === 1 ? "room type" : "room types"}
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          Add room
        </Button>
      </div>

      {initialRooms.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-border-base py-20 text-center">
          <h2 className="font-display text-2xl font-medium">No rooms yet</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm text-fg-muted">
            Add your first room, or run{" "}
            <code className="rounded bg-bg-subtle px-1.5 py-0.5">npm run seed</code> for demo data.
          </p>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {initialRooms.map((room) => (
            <li
              key={room._id}
              className="flex flex-col gap-4 rounded-3xl border border-border-base bg-bg-elevated p-4 sm:flex-row sm:items-center sm:p-5"
            >
              <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-2xl sm:size-24">
                <Image
                  src={room.images?.[0]?.url ?? FALLBACK}
                  alt={room.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-xl font-medium">{room.name}</h2>
                  {room.featured && <Badge tone="brass">Signature</Badge>}
                  <Badge tone={room.active ? "success" : "neutral"}>
                    {room.active ? "Live" : "Hidden"}
                  </Badge>
                </div>
                <p className="mt-1 line-clamp-1 text-sm text-fg-muted">{room.shortDescription}</p>
                <p className="mt-2 text-sm">
                  <span className="font-medium">{formatCurrency(room.pricePerNight)}</span>
                  <span className="text-fg-muted"> / night · {room.totalUnits} units · </span>
                  <span className="text-fg-muted">up to {room.capacity.adults} adults</span>
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy === room._id}
                  onClick={() => toggleActive(room)}
                  aria-label={room.active ? "Hide room" : "Publish room"}
                >
                  {room.active ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(room)}>
                  <Pencil className="size-3.5" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy === room._id}
                  onClick={() => remove(room)}
                  className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                  aria-label="Delete room"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <RoomDialog
          room={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function RoomDialog({
  room,
  onClose,
  onSaved,
}: {
  room: RoomDTO | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = room !== null;
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RoomInput, unknown, RoomOutput>({
    resolver: zodResolver(roomSchema),
    defaultValues: room
      ? {
          name: room.name,
          slug: room.slug,
          description: room.description,
          shortDescription: room.shortDescription,
          // Stored in paise; the form works in rupees.
          pricePerNight: room.pricePerNight / 100,
          adults: room.capacity.adults,
          children: room.capacity.children,
          bedType: room.bedType,
          sizeSqft: room.sizeSqft,
          totalUnits: room.totalUnits,
          amenities: room.amenities.join(", "),
          images: room.images.map((i) => i.url).join(", "),
          featured: room.featured,
          active: room.active,
        }
      : {
          name: "",
          slug: "",
          description: "",
          shortDescription: "",
          pricePerNight: 12000,
          adults: 2,
          children: 1,
          bedType: "King",
          sizeSqft: 400,
          totalUnits: 3,
          amenities: "",
          images: "",
          featured: false,
          active: true,
        },
  });

  const slug = watch("slug");

  async function onSubmit(values: RoomOutput) {
    setSaving(true);
    try {
      const result = isEdit
        ? await updateRoomAction(room!._id, values)
        : await createRoomAction(values);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(isEdit ? "Room updated." : "Room created.");
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
      <div className="mx-auto my-8 w-full max-w-2xl rounded-3xl border border-border-base bg-bg-elevated shadow-2xl">
        <div className="flex items-center justify-between border-b border-border-base p-6">
          <h2 className="font-display text-2xl font-medium">
            {isEdit ? `Edit ${room!.name}` : "Add a room"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-full hover:bg-bg-subtle"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Room name"
              error={errors.name?.message}
              {...register("name", {
                onChange: (e) => {
                  // Auto-fill the slug from the name when creating.
                  if (!isEdit) setValue("slug", slugify(e.target.value));
                },
              })}
            />
            <Input
              label="Slug"
              hint={slug ? `/rooms/${slug}` : "URL fragment"}
              error={errors.slug?.message}
              {...register("slug")}
            />
          </div>

          <Input
            label="Short description"
            hint="Shown on room cards"
            error={errors.shortDescription?.message}
            {...register("shortDescription")}
          />

          <Textarea
            label="Full description"
            hint="Blank lines separate paragraphs"
            error={errors.description?.message}
            {...register("description")}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Price per night (₹)"
              type="number"
              min={1}
              error={errors.pricePerNight?.message}
              {...register("pricePerNight")}
            />
            <Input
              label="Units available"
              type="number"
              min={1}
              hint="Physical rooms of this type"
              error={errors.totalUnits?.message}
              {...register("totalUnits")}
            />
            <Input
              label="Size (sq ft)"
              type="number"
              min={1}
              error={errors.sizeSqft?.message}
              {...register("sizeSqft")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Max adults"
              type="number"
              min={1}
              error={errors.adults?.message}
              {...register("adults")}
            />
            <Input
              label="Max children"
              type="number"
              min={0}
              error={errors.children?.message}
              {...register("children")}
            />
            <Input label="Bed type" error={errors.bedType?.message} {...register("bedType")} />
          </div>

          <Textarea
            label="Amenities"
            hint="Comma separated — e.g. Private balcony, Rain shower, Espresso machine"
            {...register("amenities")}
          />

          <Textarea
            label="Image URLs"
            hint="Comma separated. Paste Cloudinary or any https image URLs."
            {...register("images")}
          />

          <div className="flex gap-6 pt-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" className="size-4 accent-forest-600" {...register("featured")} />
              Signature room
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" className="size-4 accent-forest-600" {...register("active")} />
              Visible on the site
            </label>
          </div>

          <div className="flex justify-end gap-3 border-t border-border-base pt-5">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {isEdit ? "Save changes" : "Create room"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
