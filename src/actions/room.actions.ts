"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/guards";
import {
  createRoom as createRoomService,
  updateRoom as updateRoomService,
  deleteRoom as deleteRoomService,
  type DeleteRoomResult,
} from "@/services/room.service";
import { roomSchema } from "@/validators/room";
import type { RoomDTO } from "@/types/models";
import type { ActionResult } from "./booking.actions";

/** Admin room mutations. Each one re-checks the admin role server-side. */

function toError(err: unknown): ActionResult<never> {
  if (err instanceof Error && !("digest" in err)) {
    return { ok: false, error: err.message };
  }
  console.error("[action]", err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

/** Revalidate everywhere room data is rendered. */
function revalidateRooms(slug?: string) {
  revalidatePath("/");
  revalidatePath("/rooms");
  revalidatePath("/admin/rooms");
  if (slug) revalidatePath(`/rooms/${slug}`);
}

export async function createRoomAction(input: unknown): Promise<ActionResult<RoomDTO>> {
  try {
    await requireAdmin();
    const parsed = roomSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        error: "Please check the form.",
        issues: parsed.error.flatten().fieldErrors,
      };
    }

    const room = await createRoomService(parsed.data);
    revalidateRooms(room.slug);
    return { ok: true, data: room };
  } catch (err) {
    return toError(err);
  }
}

export async function updateRoomAction(
  id: string,
  input: unknown,
): Promise<ActionResult<RoomDTO>> {
  try {
    await requireAdmin();
    const parsed = roomSchema.partial().safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        error: "Please check the form.",
        issues: parsed.error.flatten().fieldErrors,
      };
    }

    const room = await updateRoomService(id, parsed.data);
    if (!room) return { ok: false, error: "Room not found." };

    revalidateRooms(room.slug);
    return { ok: true, data: room };
  } catch (err) {
    return toError(err);
  }
}

export async function deleteRoomAction(
  id: string,
): Promise<ActionResult<DeleteRoomResult>> {
  try {
    await requireAdmin();
    const result = await deleteRoomService(id);
    if (!result) return { ok: false, error: "Room not found." };

    revalidateRooms();
    return { ok: true, data: result };
  } catch (err) {
    return toError(err);
  }
}
