import { sendContactAction } from "@/actions/contact.actions";
import { errorResponse } from "@/lib/guards";

/** Kept for non-browser clients; the site itself calls the Server Action. */
export async function POST(req: Request) {
  try {
    const result = await sendContactAction(await req.json());

    if (!result.ok) {
      return Response.json({ error: result.error, issues: result.issues }, { status: 400 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
