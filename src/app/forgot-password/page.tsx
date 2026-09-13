import { Suspense } from "react";
import type { Metadata } from "next";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import Spinner from "@/components/ui/Spinner";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset the password for your Greenova account.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center">
          <Spinner />
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}
