import Image from "next/image";
import Link from "next/link";
import { Leaf } from "lucide-react";

/** Split-screen frame shared by the sign-in and register pages. */
export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Form side */}
      <div className="flex flex-col justify-center px-4 py-24 sm:px-8 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="mb-10 inline-flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-full bg-forest-700 dark:bg-forest-600">
              <Leaf className="size-4 text-white" strokeWidth={2} />
            </span>
            <span className="font-display text-2xl font-semibold">Greenova</span>
          </Link>

          <h1 className="font-display text-4xl leading-tight font-light">{title}</h1>
          <p className="mt-2 text-sm text-fg-muted">{subtitle}</p>

          <div className="mt-8">{children}</div>

          <div className="mt-8 text-center text-sm text-fg-muted">{footer}</div>
        </div>
      </div>

      {/* Image side */}
      <div className="relative hidden lg:block">
        <Image
          src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1600&auto=format&fit=crop"
          alt=""
          fill
          sizes="50vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-950/85 via-forest-950/30 to-transparent" />
        <blockquote className="absolute right-12 bottom-16 left-12 text-white">
          <p className="font-display text-3xl leading-snug font-light text-balance">
            &ldquo;The silence here is the luxury. Everything else is simply very well
            considered.&rdquo;
          </p>
          <footer className="mt-4 text-sm text-white/70">
            Condé Nast Traveller &middot; Gold List
          </footer>
        </blockquote>
      </div>
    </div>
  );
}
