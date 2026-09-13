import { registerUser } from "@/services/user.service";
import { registerSchema } from "@/validators/auth";
import { errorResponse } from "@/lib/guards";

export async function POST(req: Request) {
  try {
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
