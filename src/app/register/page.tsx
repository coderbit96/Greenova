import { Suspense } from "react";
import type { Metadata } from "next";
import RegisterForm from "@/components/auth/RegisterForm";
import Spinner from "@/components/ui/Spinner";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a Greenova account to book and manage your stays.",
};

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center">
          <Spinner />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
