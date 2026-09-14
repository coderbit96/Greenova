import { registerUser } from "@/services/user.service";
import { registerSchema } from "@/validators/auth";
import { errorResponse } from "@/lib/guards";
import { allowRateLimited, clientAddress } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const throttle = allowRateLimited(`auth:register:${clientAddress(req.headers)}`, 5, 60 * 60 * 1_000);
    if (!throttle.allowed) {
      return Response.json(
        { error: `Too many attempts. Try again in ${throttle.retryAfterSeconds} seconds.` },
        { status: 429 },
      );
    }

    const parsed = registerSchema.safeParse(await req.json());

    if (!parsed.success) {
      return Response.json(
        { error: "Please check the form", issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const user = await registerUser(parsed.data);
    return Response.json(
      { id: user._id, name: user.name, email: user.email },
      { status: 201 },
    );
  } catch (err) {
    return errorResponse(err);
  }
}
