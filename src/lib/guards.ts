import { auth } from "@/lib/auth";
import type { Session } from "next-auth";

/** Any error carrying the HTTP status the client should see. */
export interface StatusError {
  status: number;
  message: string;
}

export class HttpError extends Error implements StatusError {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/**
 * Service-layer errors (BookingError, UserError) carry their own status and
 * a message written for guests, so they are surfaced rather than masked as a
 * 500. Anything else is an unexpected fault and stays opaque.
 */
function isStatusError(err: unknown): err is StatusError {
  return (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    typeof (err as StatusError).status === "number" &&
    (err as StatusError).status >= 400 &&
    (err as StatusError).status < 600 &&
    "message" in err &&
    typeof (err as StatusError).message === "string"
  );
}

/** Throws 401 unless a session exists. */
export async function requireUser(): Promise<Session> {
  const session = await auth();
  if (!session?.user?.id) throw new HttpError(401, "You must be signed in.");
  return session;
}

/** Throws 401/403 unless the caller is an admin. */
export async function requireAdmin(): Promise<Session> {
  const session = await requireUser();
  if (session.user.role !== "admin") {
    throw new HttpError(403, "Administrator access required.");
  }
  return session;
}

/** Maps a thrown error to a JSON response, hiding internals from clients. */
export function errorResponse(err: unknown) {
  if (isStatusError(err)) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  console.error("[api]", err);
  return Response.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 },
  );
}
