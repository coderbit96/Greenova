import { Suspense } from "react";
import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";
import Spinner from "@/components/ui/Spinner";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to manage your Greenova reservations.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center">
          <Spinner />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
