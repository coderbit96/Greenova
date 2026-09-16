import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "@/validators/auth";
import { allowRateLimited, clientAddress } from "@/lib/rate-limit";
import { verifyFirebaseIdToken } from "@/lib/firebase/admin";
import {
  getUserByEmail,
  getUserById,
  upsertFirebaseUser,
  verifyCredentials,
} from "@/services/user.service";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  // Auth.js marks session cookies Secure in production and keeps them
  // HttpOnly/SameSite=Lax. State it explicitly so deployment mode cannot
  // accidentally downgrade the session cookie.
  useSecureCookies: process.env.NODE_ENV === "production",
  pages: { signIn: "/login", error: "/login" },
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw, request) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;

        const throttle = allowRateLimited(
          `auth:login:${clientAddress(request.headers)}:${parsed.data.email}`,
          10,
          15 * 60 * 1_000,
        );
        if (!throttle.allowed) return null;

        return verifyCredentials(parsed.data.email, parsed.data.password);
      },
    }),
    Credentials({
      id: "firebase",
      name: "Firebase",
      credentials: {
        idToken: { label: "Firebase ID token", type: "text" },
      },
      async authorize(raw, request) {
        const idToken = typeof raw?.idToken === "string" ? raw.idToken : "";
        const throttle = allowRateLimited(
          `auth:firebase:${clientAddress(request.headers)}`,
          30,
          15 * 60 * 1_000,
        );
        if (!throttle.allowed) return null;

        const decoded = await verifyFirebaseIdToken(idToken);
        if (!decoded?.uid || !decoded.email) return null;

        try {
          return await upsertFirebaseUser({
            uid: decoded.uid,
            email: decoded.email,
            name: typeof decoded.name === "string" ? decoded.name : null,
            image: typeof decoded.picture === "string" ? decoded.picture : null,
            emailVerified: decoded.email_verified === true,
          });
        } catch {
          // Credentials providers should return null for a failed identity
          // link, never disclose account-linking details to an attacker.
          return null;
        }
      },
    }),
  ],
  callbacks: {
    redirect({ url, baseUrl }) {
      try {
        const target = new URL(url, baseUrl);
        return target.origin === new URL(baseUrl).origin ? target.toString() : baseUrl;
      } catch {
        return baseUrl;
      }
    },
    async jwt({ token, user, trigger }) {
      // On sign-in, or when the client calls update(), resync from the DB
      // so a role change takes effect without forcing a re-login.
      const email = token.email ?? user?.email;
      if (email && (user?.email || trigger === "update")) {
        // Prefer id after the first login: an account email can be updated
        // from /account, while the token still contains the prior address.
        const dbUser = token.id
          ? await getUserById(String(token.id))
          : await getUserByEmail(email);
        if (dbUser) {
          token.id = String(dbUser._id);
          token.role = dbUser.role;
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.picture = dbUser.image;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token.id) session.user.id = token.id;
      session.user.role = token.role ?? "customer";
      if (token.name) session.user.name = token.name;
      if (token.email) session.user.email = token.email;
      session.user.image = typeof token.picture === "string" ? token.picture : null;
      return session;
    },
  },
});
