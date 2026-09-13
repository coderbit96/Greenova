import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="grid min-h-[70svh] place-items-center px-4 py-32">
      <div className="text-center">
        <p className="font-display text-8xl font-light text-forest-200 dark:text-forest-900">404</p>
        <h1 className="mt-4 font-display text-4xl leading-tight font-light">
          This path does not lead anywhere
        </h1>
        <p className="mx-auto mt-4 max-w-md leading-relaxed text-fg-muted">
          The page you were looking for has moved, or perhaps never existed. The forest is
          large.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <LinkButton href="/">Return home</LinkButton>
          <LinkButton href="/rooms" variant="outline">
            Browse suites
          </LinkButton>
        </div>
        <p className="mt-8 text-sm text-fg-muted">
          Need a hand?{" "}
          <Link href="/contact" className="underline underline-offset-4 hover:text-fg">
            Contact us
          </Link>
        </p>
      </div>
    </div>
  );
}
