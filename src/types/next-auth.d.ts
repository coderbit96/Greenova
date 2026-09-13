import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "customer" | "admin";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "customer" | "admin";
  }
}

// next-auth/jwt re-exports @auth/core/jwt, so the augmentation must target
// the source module for the JWT interface to actually widen.
declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: "customer" | "admin";
  }
}
