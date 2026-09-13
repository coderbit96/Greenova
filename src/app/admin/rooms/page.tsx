import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listAllRooms } from "@/services/room.service";
import AdminRooms from "@/components/admin/AdminRooms";

export const metadata: Metadata = {
  title: "Manage Rooms",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminRoomsPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/login?callbackUrl=/admin/rooms");

  const rooms = await listAllRooms();
  return <AdminRooms initialRooms={rooms} />;
}
