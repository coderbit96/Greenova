import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import Room from "@/models/Room";
import User from "@/models/User";
import { serialize, todayUTC, MS_PER_DAY } from "@/utils";
import type {
  PopulatedBookingDTO,
  DashboardStats,
  CustomerAccountDashboardDTO,
  RevenuePoint,
  UserDTO,
} from "@/types/models";

/** Aggregations powering the admin dashboard and the guest profile. */

export async function getDashboardData(): Promise<{
  stats: DashboardStats;
  recentBookings: PopulatedBookingDTO[];
  revenueByDay: RevenuePoint[];
}> {
  await connectDB();

  const today = todayUTC();
  const monthAgo = new Date(today.getTime() - 30 * MS_PER_DAY);
  const tomorrow = new Date(today.getTime() + MS_PER_DAY);

  const [
    totalBookings,
    confirmedBookings,
    pendingBookings,
    cancelledBookings,
    totalRooms,
    activeRooms,
    totalCustomers,
    revenueAgg,
    monthRevenueAgg,
    arrivalsToday,
    inHouse,
    recent,
    revenueByDay,
  ] = await Promise.all([
    Booking.countDocuments({}),
    Booking.countDocuments({ status: "confirmed" }),
    Booking.countDocuments({ status: "pending" }),
    Booking.countDocuments({ status: "cancelled" }),
    Room.countDocuments({}),
    Room.countDocuments({ active: true }),
    User.countDocuments({ role: "customer" }),
    Booking.aggregate([
      { $match: { "payment.status": "paid" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    Booking.aggregate([
      { $match: { "payment.status": "paid", "payment.paidAt": { $gte: monthAgo } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    Booking.countDocuments({
      checkIn: { $gte: today, $lt: tomorrow },
      status: { $in: ["confirmed", "pending"] },
    }),
    Booking.countDocuments({
      checkIn: { $lte: today },
      checkOut: { $gt: today },
      status: "confirmed",
    }),
    Booking.find({}).populate("room", "name slug").sort({ createdAt: -1 }).limit(6).lean(),
    Booking.aggregate([
      { $match: { "payment.status": "paid", "payment.paidAt": { $gte: monthAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$payment.paidAt" } },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return {
    stats: {
      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      totalRooms,
      activeRooms,
      totalCustomers,
      totalRevenue: revenueAgg[0]?.total ?? 0,
      monthRevenue: monthRevenueAgg[0]?.total ?? 0,
      arrivalsToday,
      inHouse,
    },
    recentBookings: serialize(recent) as unknown as PopulatedBookingDTO[],
    revenueByDay: serialize(revenueByDay) as unknown as RevenuePoint[],
  };
}

export interface GuestProfile {
  user: UserDTO | null;
  totalStays: number;
  totalNights: number;
  totalSpend: number;
}

export async function getGuestProfile(userId: string): Promise<GuestProfile> {
  await connectDB();
  const objectId = mongoose.Types.ObjectId.createFromHexString(userId);

  const [user, totalStays, nightsAgg, spendAgg] = await Promise.all([
    User.findById(userId).lean(),
    Booking.countDocuments({
      user: userId,
      status: { $in: ["confirmed", "completed"] },
    }),
    Booking.aggregate([
      { $match: { user: objectId, status: { $in: ["confirmed", "completed"] } } },
      { $group: { _id: null, nights: { $sum: "$nights" } } },
    ]),
    Booking.aggregate([
      { $match: { user: objectId, "payment.status": "paid" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
  ]);

  return {
    user: user ? (serialize(user) as unknown as UserDTO) : null,
    totalStays,
    totalNights: nightsAgg[0]?.nights ?? 0,
    totalSpend: spendAgg[0]?.total ?? 0,
  };
}

/**
 * Customer-facing account overview. Booking contact details stay snapshots on
 * their bookings; this returns the current account profile alongside booking
 * activity without mutating historical reservations.
 */
export async function getCustomerAccountDashboard(
  userId: string,
): Promise<CustomerAccountDashboardDTO> {
  await connectDB();
  const today = todayUTC();

  const [user, totalBookings, completedStays, cancelledBookings, upcomingBooking, recentActivity] =
    await Promise.all([
      User.findById(userId).lean(),
      Booking.countDocuments({ user: userId }),
      Booking.countDocuments({ user: userId, status: "completed" }),
      Booking.countDocuments({ user: userId, status: "cancelled" }),
      Booking.findOne({
        user: userId,
        status: { $in: ["pending", "confirmed"] },
        checkOut: { $gt: today },
      })
        .populate("room", "name slug images bedType pricePerNight")
        .sort({ checkIn: 1 })
        .lean(),
      Booking.find({ user: userId })
        .populate("room", "name slug images bedType pricePerNight")
        .sort({ updatedAt: -1 })
        .limit(5)
        .lean(),
    ]);

  return {
    user: user ? (serialize(user) as unknown as UserDTO) : null,
    totalBookings,
    completedStays,
    cancelledBookings,
    upcomingBooking: upcomingBooking
      ? (serialize(upcomingBooking) as unknown as PopulatedBookingDTO)
      : null,
    recentActivity: serialize(recentActivity) as unknown as PopulatedBookingDTO[],
  };
}
