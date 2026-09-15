import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import Room from "@/models/Room";
import User from "@/models/User";
import { serialize, todayUTC, MS_PER_DAY } from "@/utils";
import type {
  BookingStatus,
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


/* --- Admin dashboard ---------------------------------------------------
   Every figure below is derived from the bookings, rooms and users
   collections. Bookings carry both lower-case lifecycle fields and
   upper-case projections; the lower-case fields exist on every document,
   so the aggregations match on those. */

const OCCUPYING: BookingStatus[] = ["confirmed", "completed"];

export interface AdminOverviewMetrics {
  bookingsToday: number;
  checkInsToday: number;
  checkOutsToday: number;
  confirmedBookings: number;
  availableRooms: number;
  occupiedRooms: number;
  occupancyPercent: number;
  revenueToday: number;
  revenueMonth: number;
  pendingPayments: number;
  pendingPaymentsValue: number;
  cancellations: number;
}

export interface TrendPoint {
  date: string;
  value: number;
}

export interface LabelledCount {
  label: string;
  value: number;
}

export interface AdminOverview {
  metrics: AdminOverviewMetrics;
  revenueTrend: TrendPoint[];
  bookingTrend: TrendPoint[];
  occupancyTrend: TrendPoint[];
  roomPopularity: LabelledCount[];
  paymentStatus: LabelledCount[];
  bookingStatus: LabelledCount[];
  bookingSource: LabelledCount[];
  recentBookings: PopulatedBookingDTO[];
}

/** Total sellable units across every live room type. */
async function sellableUnits(): Promise<number> {
  const [agg] = await Room.aggregate<{ total: number }>([
    { $match: { active: true } },
    { $group: { _id: null, total: { $sum: "$totalUnits" } } },
  ]);
  return agg?.total ?? 0;
}

export async function getAdminOverview(days = 30): Promise<AdminOverview> {
  await connectDB();

  const today = todayUTC();
  const tomorrow = new Date(today.getTime() + MS_PER_DAY);
  const windowStart = new Date(today.getTime() - (days - 1) * MS_PER_DAY);
  const monthStart = new Date(today.getTime() - 29 * MS_PER_DAY);

  const [
    bookingsToday,
    checkInsToday,
    checkOutsToday,
    confirmedBookings,
    cancellations,
    totalUnits,
    occupiedAgg,
    revenueTodayAgg,
    revenueMonthAgg,
    pendingAgg,
    revenueSeries,
    bookingSeries,
    occupancySeries,
    popularity,
    paymentSplit,
    statusSplit,
    sourceSplit,
    recent,
  ] = await Promise.all([
    Booking.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
    Booking.countDocuments({
      checkIn: { $gte: today, $lt: tomorrow },
      status: { $in: OCCUPYING },
    }),
    Booking.countDocuments({
      checkOut: { $gte: today, $lt: tomorrow },
      status: { $in: [...OCCUPYING, "pending"] },
    }),
    Booking.countDocuments({ status: "confirmed" }),
    Booking.countDocuments({ status: "cancelled" }),
    sellableUnits(),

    // Rooms physically occupied tonight: sum units booked, not documents.
    Booking.aggregate<{ units: number }>([
      {
        $match: {
          status: { $in: OCCUPYING },
          checkIn: { $lte: today },
          checkOut: { $gt: today },
        },
      },
      { $group: { _id: null, units: { $sum: { $ifNull: ["$roomsBooked", 1] } } } },
    ]),

    Booking.aggregate<{ total: number }>([
      {
        $match: {
          "payment.status": "paid",
          "payment.paidAt": { $gte: today, $lt: tomorrow },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    Booking.aggregate<{ total: number }>([
      { $match: { "payment.status": "paid", "payment.paidAt": { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),

    // Money still owed: pending payments on bookings that are not cancelled.
    Booking.aggregate<{ count: number; value: number }>([
      { $match: { "payment.status": "pending", status: { $ne: "cancelled" } } },
      { $group: { _id: null, count: { $sum: 1 }, value: { $sum: "$totalAmount" } } },
    ]),

    // Revenue trend, by the day payment cleared.
    Booking.aggregate<{ _id: string; value: number }>([
      { $match: { "payment.status": "paid", "payment.paidAt": { $gte: windowStart } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$payment.paidAt" } },
          value: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Booking trend, by the day the reservation was made.
    Booking.aggregate<{ _id: string; value: number }>([
      { $match: { createdAt: { $gte: windowStart } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          value: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Occupancy trend: expand each stay into the nights it covers, so a
    // three-night booking counts towards all three days rather than one.
    Booking.aggregate<{ _id: string; units: number }>([
      {
        $match: {
          status: { $in: OCCUPYING },
          checkOut: { $gt: windowStart },
          checkIn: { $lt: tomorrow },
        },
      },
      {
        $project: {
          checkIn: 1,
          roomsBooked: { $ifNull: ["$roomsBooked", 1] },
          nights: {
            $range: [
              0,
              {
                $max: [
                  1,
                  { $dateDiff: { startDate: "$checkIn", endDate: "$checkOut", unit: "day" } },
                ],
              },
            ],
          },
        },
      },
      { $unwind: "$nights" },
      {
        $project: {
          roomsBooked: 1,
          day: { $dateAdd: { startDate: "$checkIn", unit: "day", amount: "$nights" } },
        },
      },
      { $match: { day: { $gte: windowStart, $lt: tomorrow } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$day" } },
          units: { $sum: "$roomsBooked" },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Room popularity by units sold, excluding cancellations.
    Booking.aggregate<{ _id: string; value: number }>([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: "$room", value: { $sum: { $ifNull: ["$roomsBooked", 1] } } } },
      { $sort: { value: -1 } },
      { $limit: 6 },
      { $lookup: { from: "rooms", localField: "_id", foreignField: "_id", as: "room" } },
      { $unwind: { path: "$room", preserveNullAndEmptyArrays: true } },
      { $project: { _id: { $ifNull: ["$room.name", "Unknown room"] }, value: 1 } },
    ]),

    Booking.aggregate<{ _id: string; value: number }>([
      { $group: { _id: "$payment.status", value: { $sum: 1 } } },
      { $sort: { value: -1 } },
    ]),
    Booking.aggregate<{ _id: string; value: number }>([
      { $group: { _id: "$status", value: { $sum: 1 } } },
      { $sort: { value: -1 } },
    ]),
    Booking.aggregate<{ _id: string; value: number }>([
      { $group: { _id: { $ifNull: ["$bookingSource", "ONLINE"] }, value: { $sum: 1 } } },
      { $sort: { value: -1 } },
    ]),

    Booking.find({}).populate("room", "name slug").sort({ createdAt: -1 }).limit(8).lean(),
  ]);

  const occupiedRooms = occupiedAgg[0]?.units ?? 0;
  const availableRooms = Math.max(0, totalUnits - occupiedRooms);

  /** Fills gaps so a quiet day plots as zero rather than vanishing. */
  const toSeries = (
    rows: { _id: string; value?: number; units?: number }[],
  ): TrendPoint[] => {
    const byDay = new Map(rows.map((r) => [r._id, r.value ?? r.units ?? 0]));
    const out: TrendPoint[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const key = new Date(today.getTime() - i * MS_PER_DAY).toISOString().slice(0, 10);
      out.push({ date: key, value: byDay.get(key) ?? 0 });
    }
    return out;
  };

  const occupancyTrend = toSeries(occupancySeries).map((p) => ({
    date: p.date,
    // Percentage of the estate sold that night.
    value: totalUnits > 0 ? Math.round((p.value / totalUnits) * 100) : 0,
  }));

  const titleCase = (v: string) => (v ? v[0].toUpperCase() + v.slice(1) : "Unknown");

  return {
    metrics: {
      bookingsToday,
      checkInsToday,
      checkOutsToday,
      confirmedBookings,
      availableRooms,
      occupiedRooms,
      occupancyPercent: totalUnits > 0 ? Math.round((occupiedRooms / totalUnits) * 100) : 0,
      revenueToday: revenueTodayAgg[0]?.total ?? 0,
      revenueMonth: revenueMonthAgg[0]?.total ?? 0,
      pendingPayments: pendingAgg[0]?.count ?? 0,
      pendingPaymentsValue: pendingAgg[0]?.value ?? 0,
      cancellations,
    },
    revenueTrend: toSeries(revenueSeries),
    bookingTrend: toSeries(bookingSeries),
    occupancyTrend,
    roomPopularity: popularity.map((r) => ({ label: r._id, value: r.value })),
    paymentStatus: paymentSplit.map((r) => ({ label: titleCase(r._id), value: r.value })),
    bookingStatus: statusSplit.map((r) => ({ label: titleCase(r._id), value: r.value })),
    bookingSource: sourceSplit.map((r) => ({ label: titleCase(r._id).replaceAll("_", " "), value: r.value })),
    recentBookings: serialize(recent) as unknown as PopulatedBookingDTO[],
  };
}


export interface OccupancyDay {
  /** yyyy-mm-dd */
  date: string;
  /** Units occupied that night. */
  occupied: number;
  /** Bookings whose stay begins that day. */
  arrivals: number;
}

export interface OccupancyCalendar {
  days: OccupancyDay[];
  totalUnits: number;
}

/**
 * Forward-looking occupancy, one entry per night.
 *
 * A stay is expanded into every night it covers, so a three-night booking
 * counts towards all three days rather than only its arrival date. Units are
 * summed via `roomsBooked`, so a two-room reservation occupies two units.
 */
export async function getOccupancyCalendar(days = 28): Promise<OccupancyCalendar> {
  await connectDB();

  const today = todayUTC();
  const end = new Date(today.getTime() + days * MS_PER_DAY);

  const [totalUnitsAgg, occupancy, arrivals] = await Promise.all([
    Room.aggregate<{ total: number }>([
      { $match: { active: true } },
      { $group: { _id: null, total: { $sum: "$totalUnits" } } },
    ]),

    Booking.aggregate<{ _id: string; units: number }>([
      {
        $match: {
          status: { $in: ["confirmed", "completed"] },
          checkOut: { $gt: today },
          checkIn: { $lt: end },
        },
      },
      {
        $project: {
          checkIn: 1,
          roomsBooked: { $ifNull: ["$roomsBooked", 1] },
          nights: {
            $range: [
              0,
              {
                $max: [
                  1,
                  { $dateDiff: { startDate: "$checkIn", endDate: "$checkOut", unit: "day" } },
                ],
              },
            ],
          },
        },
      },
      { $unwind: "$nights" },
      {
        $project: {
          roomsBooked: 1,
          day: { $dateAdd: { startDate: "$checkIn", unit: "day", amount: "$nights" } },
        },
      },
      { $match: { day: { $gte: today, $lt: end } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$day" } },
          units: { $sum: "$roomsBooked" },
        },
      },
    ]),

    Booking.aggregate<{ _id: string; count: number }>([
      {
        $match: {
          status: { $in: ["confirmed", "completed", "pending"] },
          checkIn: { $gte: today, $lt: end },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$checkIn" } },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const occupiedByDay = new Map(occupancy.map((r) => [r._id, r.units]));
  const arrivalsByDay = new Map(arrivals.map((r) => [r._id, r.count]));

  const out: OccupancyDay[] = [];
  for (let i = 0; i < days; i++) {
    const key = new Date(today.getTime() + i * MS_PER_DAY).toISOString().slice(0, 10);
    out.push({
      date: key,
      occupied: occupiedByDay.get(key) ?? 0,
      arrivals: arrivalsByDay.get(key) ?? 0,
    });
  }

  return { days: out, totalUnits: totalUnitsAgg[0]?.total ?? 0 };
}

/** Booking-level rows for the operational calendar, including cancelled and no-show history. */
export async function getBookingCalendar(days = 28): Promise<PopulatedBookingDTO[]> {
  await connectDB();
  const from = todayUTC();
  const to = new Date(from.getTime() + days * MS_PER_DAY);
  const bookings = await Booking.find({
    checkOut: { $gt: from },
    checkIn: { $lt: to },
  })
    .populate("room", "name category units totalUnits")
    .sort({ checkIn: 1, createdAt: -1 })
    .lean();
  return serialize(bookings) as unknown as PopulatedBookingDTO[];
}
