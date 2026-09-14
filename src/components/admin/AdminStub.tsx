import { Link2Off } from "lucide-react";
import Link from "next/link";

/**
 * Placeholder for an admin section whose data does not exist yet.
 *
 * The dashboard is built on real MongoDB collections. Sections without a
 * backing model say so plainly and name what they would need, rather than
 * showing invented rows that look like live data.
 */
export default function AdminStub({
  title,
  description,
  requires,
}: {
  title: string;
  description: string;
  /** The model(s) this section would read from once they exist. */
  requires: string[];
}) {
  return (
    <div>
      <h1 className="font-display text-4xl leading-tight font-light sm:text-5xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fg-muted">{description}</p>

      <div className="mt-10 rounded-3xl border border-dashed border-border-base p-10 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-bg-subtle text-fg-muted">
          <Link2Off className="size-5" strokeWidth={1.75} />
        </span>

        <h2 className="mt-5 font-display text-2xl font-medium">Not configured yet</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-fg-muted">
          There is no data behind this section, so nothing is shown. The rest of the
          dashboard reads live records from MongoDB; this one would need{" "}
          {requires.map((r, i) => (
            <span key={r}>
              {i > 0 && (i === requires.length - 1 ? " and " : ", ")}
              <code className="rounded bg-bg-subtle px-1.5 py-0.5 text-xs">{r}</code>
            </span>
          ))}{" "}
          {requires.length === 1 ? "to exist" : "to exist"}.
        </p>

        <p className="mt-6 text-xs text-fg-muted">
          Working sections:{" "}
          <Link href="/admin" className="underline underline-offset-4 hover:text-fg">
            Dashboard
          </Link>
          {" · "}
          <Link href="/admin/bookings" className="underline underline-offset-4 hover:text-fg">
            Bookings
          </Link>
          {" · "}
          <Link href="/admin/rooms" className="underline underline-offset-4 hover:text-fg">
            Rooms
          </Link>
          {" · "}
          <Link
            href="/admin/customers"
            className="underline underline-offset-4 hover:text-fg"
          >
            Customers
          </Link>
        </p>
      </div>
    </div>
  );
}
